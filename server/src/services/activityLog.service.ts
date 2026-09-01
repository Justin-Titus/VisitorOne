import ActivityLog from '../models/ActivityLog.model';
import User from '../models/User.model';
import { escapeRegex } from '../utils/helpers';
import { ActivityAction } from '../types';
import { Types } from 'mongoose';
import { PaginatedResult } from '../types';
import { IActivityLog } from '../types';

export const logActivity = async (
  visitRequestId: Types.ObjectId,
  action: ActivityAction,
  performedBy: Types.ObjectId,
  remarks = '',
) => {
  const log = new ActivityLog({
    visitRequest: visitRequestId,
    action,
    performedBy,
    remarks,
  });
  await log.save();
  return log;
};

export const getActivitiesForRequest = async (visitRequestId: string) => {
  return await ActivityLog.find({ visitRequest: visitRequestId })
    .populate('performedBy', 'name role')
    .sort({ timestamp: 1 });
};

export const getGlobalActivityLogs = async (
  filters: Record<string, string | undefined>,
  page = 1,
  limit = 10,
): Promise<PaginatedResult<IActivityLog>> => {
  const query: Record<string, unknown> = {};
  if (filters['visitRequestId']) query['visitRequest'] = filters['visitRequestId'];
  if (filters['userId']) query['performedBy'] = filters['userId'];
  if (filters['action']) query['action'] = filters['action'];
  if (filters['from'] || filters['to']) {
    const tsQuery: Record<string, Date> = {};
    if (filters['from']) tsQuery['$gte'] = new Date(filters['from']);
    if (filters['to']) tsQuery['$lte'] = new Date(filters['to']);
    query['timestamp'] = tsQuery;
  }

  if (filters['search']) {
    const safeSearch = escapeRegex(filters['search']);
    const matchingUsers = await User.find({
      name: { $regex: safeSearch, $options: 'i' },
    }).select('_id');
    const userIds = matchingUsers.map((u) => u._id);

    const orConditions: Record<string, unknown>[] = [
      { remarks: { $regex: safeSearch, $options: 'i' } },
      { action: { $regex: safeSearch, $options: 'i' } },
    ];

    if (userIds.length > 0) {
      orConditions.push({ performedBy: { $in: userIds } });
    }

    query['$or'] = orConditions;
  }

  const skip = (page - 1) * limit;
  const data = (await ActivityLog.find(query)
    .populate('visitRequest', 'purpose visitDate status')
    .populate('performedBy', 'name role')
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)) as unknown as IActivityLog[];

  const total = await ActivityLog.countDocuments(query);

  return {
    data,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
};
