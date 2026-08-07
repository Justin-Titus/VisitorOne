const Employee = require('../models/Employee.model');
const VisitRequest = require('../models/VisitRequest.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { EMPLOYEE_STATUS } = require('../utils/constants');

const getAllEmployees = asyncHandler(async (req, res) => {
  const employees = await Employee.find();
  res.status(200).json(new ApiResponse(200, employees, 'Employees fetched successfully'));
});

const createEmployee = asyncHandler(async (req, res) => {
  const existingEmployee = await Employee.findOne({ employeeCode: req.body.employeeCode });
  if (existingEmployee) {
    throw new ApiError(409, 'Employee with this code already exists');
  }

  const employee = await Employee.create(req.body);
  res.status(201).json(new ApiResponse(201, employee, 'Employee created successfully'));
});

const getEmployeeById = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) throw new ApiError(404, 'Employee not found');
  res.status(200).json(new ApiResponse(200, employee, 'Employee fetched successfully'));
});

const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!employee) throw new ApiError(404, 'Employee not found');
  res.status(200).json(new ApiResponse(200, employee, 'Employee updated successfully'));
});

const toggleStatus = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) throw new ApiError(404, 'Employee not found');

  employee.status = employee.status === EMPLOYEE_STATUS.ACTIVE ? EMPLOYEE_STATUS.INACTIVE : EMPLOYEE_STATUS.ACTIVE;
  await employee.save();
  res.status(200).json(new ApiResponse(200, employee, `Employee status changed to ${employee.status}`));
});

const deleteEmployee = asyncHandler(async (req, res) => {
  const employeeId = req.params.id;
  const hasRequests = await VisitRequest.exists({ employeeToVisit: employeeId });
  
  if (hasRequests) {
    throw new ApiError(400, 'Cannot delete employee with existing visit requests. Consider deactivating instead.');
  }

  const employee = await Employee.findByIdAndDelete(employeeId);
  if (!employee) throw new ApiError(404, 'Employee not found');
  
  res.status(200).json(new ApiResponse(200, null, 'Employee deleted successfully'));
});

module.exports = {
  getAllEmployees,
  createEmployee,
  getEmployeeById,
  updateEmployee,
  toggleStatus,
  deleteEmployee,
};
