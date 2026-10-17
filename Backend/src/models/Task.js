const mongoose = require('mongoose');

/**
 * Task Schema
 * Represents an individual task entity strictly linked to its owning user.
 */
const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [150, 'Task title cannot exceed 150 characters']
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['pending', 'in-progress', 'completed'],
        message: 'Status must be pending, in-progress, or completed'
      },
      default: 'pending',
      index: true
    },
    priority: {
      type: String,
      required: true,
      enum: {
        values: ['low', 'medium', 'high'],
        message: 'Priority must be low, medium, or high'
      },
      default: 'medium',
      index: true
    },
    dueDate: {
      type: Date,
      default: null
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task must belong to an authenticated user'],
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Compound indexes for optimal query performance on user-scoped searches, filters, and sorts
taskSchema.index({ userId: 1, createdAt: -1 });
taskSchema.index({ userId: 1, dueDate: 1 });
taskSchema.index({ userId: 1, status: 1 });
taskSchema.index({ userId: 1, priority: 1 });
taskSchema.index({ userId: 1, title: 'text' });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
