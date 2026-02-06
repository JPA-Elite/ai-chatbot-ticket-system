import {
  createStaffData,
  deleteStaffData,
  getAllStaffData,
  getMyStatsData,
  getStaffByIdData,
  updateStaffData
} from '../services/staffService.js';
import { SERVER_ERROR_MESSAGE, SERVER_ERROR_WITH_DETAILS } from '../constants/controllerMessages.js';

// @desc    Get all staff members with statistics
// @route   GET /api/staff
// @access  Private/Admin
export const getAllStaff = async (req, res) => {
  try {
    const result = await getAllStaffData();
    res.status(result.status).json(result.payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: SERVER_ERROR_WITH_DETAILS(error)
    });
  }
};

// @desc    Get staff member by ID with detailed statistics
// @route   GET /api/staff/:id
// @access  Private/Admin
export const getStaffById = async (req, res) => {
  try {
    const result = await getStaffByIdData(req.params.id);
    res.status(result.status).json(result.payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: SERVER_ERROR_MESSAGE
    });
  }
};

// @desc    Update staff member
// @route   PUT /api/staff/:id
// @access  Private/Admin
export const updateStaff = async (req, res) => {
  try {
    const result = await updateStaffData(req.params.id, req.body);
    res.status(result.status).json(result.payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: SERVER_ERROR_MESSAGE
    });
  }
};

// @desc    Create new staff member
// @route   POST /api/staff
// @access  Private/Admin
export const createStaff = async (req, res) => {
  try {
    const result = await createStaffData(req.body);
    res.status(result.status).json(result.payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: SERVER_ERROR_MESSAGE
    });
  }
};

// @desc    Delete staff member
// @route   DELETE /api/staff/:id
// @access  Private/Admin
export const deleteStaff = async (req, res) => {
  try {
    const result = await deleteStaffData(req.params.id);
    res.status(result.status).json(result.payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: SERVER_ERROR_MESSAGE
    });
  }
};

// @desc    Get current staff member's statistics
// @route   GET /api/staff/my-stats
// @access  Private/Staff
export const getMyStats = async (req, res) => {
  try {
    const result = await getMyStatsData(req.user.id);
    res.status(result.status).json(result.payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: SERVER_ERROR_MESSAGE
    });
  }
};
