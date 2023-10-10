import {
  EmployeeTask,
  PRIORITY,
  TASK_STATUS,
  Task,
  TaskList,
  User,
} from '@prisma/client'

export type FullTaskDetails = Task & {
  employeeTask: EmployeeTaskUserDetails[]
  taskList: TaskList[]
  user: User
}
export type EmployeeTaskUserDetails = EmployeeTask & {
  user: User
}

export type TaskDetails = {
  id: string
  title: string
  description: string
  ownerId: string
  owner: string
  ownerAvatar: string | null
  dueDate: Date | string | null
  status: TASK_STATUS
  priority: PRIORITY
  members: TaskMember[]
  notes: any[]
}

export type EmployeeTaskDetails = {
  id: string
  title: string
  description: string
  ownerId: string
  dueDate: Date | string | null
  status: TASK_STATUS
  priority: PRIORITY
}

export type TaskResponse = {
  message: string
  tasks: TaskDetails[]
  total: number | null
  lastpage: number | null
  nextpage: number | null
  prevpage: number | null
}

export type SingleTaskResponse = {
  message: string
  tasks: TaskDetails
}

export type UserTaskResponse = {
  message: string
  tasks: EmployeeTaskDetails[]
  total: number | null
  lastpage: number | null
  nextpage: number | null
  prevpage: number | null
}

export type TaskMember = {
  id: string
  userId: string
  avatar: string | null
  fullName: string
  isTaskLead: boolean
}

export type CollaboratorTask = EmployeeTask & {
  task: Task
}

export type TaskNote = {
  id: string
  note: string
}

export type ListWithTask = TaskList & {
  task: Task
}
