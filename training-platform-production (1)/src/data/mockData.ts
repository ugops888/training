import type { Course, Kpi, ScheduleItem, Student, StudentCourseRecord, StudentExamRecord } from '../types';

export const directKpis: Kpi[] = [
  { id: 'd1', label: '直營培訓人數', value: '1,284', unit: '人', delta: '+12.4%', trend: 'up', icon: 'users' },
  { id: 'd2', label: '平均滿意度', value: '4.7', unit: '/5.0', delta: '+0.2', trend: 'up', icon: 'star' },
  { id: 'd3', label: '課程完成率', value: '88', unit: '%', delta: '+5.1%', trend: 'up', icon: 'check' },
  { id: 'd4', label: '本季開課數', value: '46', unit: '門', delta: '+6', trend: 'up', icon: 'book' },
];

export const franchiseKpis: Kpi[] = [
  { id: 'f1', label: '加盟培訓人數', value: '2,376', unit: '人', delta: '+18.9%', trend: 'up', icon: 'users' },
  { id: 'f2', label: '平均滿意度', value: '4.5', unit: '/5.0', delta: '+0.1', trend: 'up', icon: 'star' },
  { id: 'f3', label: '課程完成率', value: '79', unit: '%', delta: '+3.2%', trend: 'up', icon: 'check' },
  { id: 'f4', label: '本季開課數', value: '62', unit: '門', delta: '+9', trend: 'up', icon: 'book' },
];

export const directSchedule: ScheduleItem[] = [
  { id: 's1', date: '10/22 週三', title: '門市服務品質提升實戰', trainer: '林婉君', location: '台北訓練中心', attendees: 32, capacity: 40 },
  { id: 's2', date: '10/24 週五', title: 'POS 系統進階操作', trainer: '陳柏安', location: '線上課程', attendees: 58, capacity: 80 },
  { id: 's3', date: '10/29 週三', title: '顧客關係管理 (CRM)', trainer: '張雅婷', location: '桃園分公司', attendees: 24, capacity: 30 },
  { id: 's4', date: '11/02 週日', title: '門店營運數據分析', trainer: '王志強', location: '線上課程', attendees: 45, capacity: 100 },
];

export const franchiseSchedule: ScheduleItem[] = [
  { id: 'fs1', date: '10/21 週二', title: '加盟創業基礎營', trainer: '李建宏', location: '高雄加盟總部', attendees: 48, capacity: 50 },
  { id: 'fs2', date: '10/25 週六', title: '品牌標準作業流程', trainer: '吳佩玲', location: '台中加盟中心', attendees: 36, capacity: 40 },
  { id: 'fs3', date: '10/28 週二', title: '商品陳列與視覺行銷', trainer: '黃俊豪', location: '線上課程', attendees: 72, capacity: 100 },
  { id: 'fs4', date: '11/01 週六', title: '加盟店財務管理', trainer: '劉淑芬', location: '線上課程', attendees: 41, capacity: 60 },
];

export const courses: Course[] = [
  { id: 'c1', name: '門市服務品質提升實戰', category: '服務品質', channel: 'direct', enrolled: 38, completed: 32, satisfaction: 4.8, schedule: '10/22', status: 'ongoing' },
  { id: 'c2', name: 'POS 系統進階操作', category: '系統操作', channel: 'direct', enrolled: 80, completed: 58, satisfaction: 4.6, schedule: '10/24', status: 'upcoming' },
  { id: 'c3', name: '顧客關係管理 (CRM)', category: '顧客經營', channel: 'direct', enrolled: 30, completed: 24, satisfaction: 4.7, schedule: '10/29', status: 'upcoming' },
  { id: 'c4', name: '門店營運數據分析', category: '數據分析', channel: 'direct', enrolled: 100, completed: 45, satisfaction: 4.5, schedule: '11/02', status: 'upcoming' },
  { id: 'c5', name: '加盟創業基礎營', category: '加盟營運', channel: 'franchise', enrolled: 50, completed: 48, satisfaction: 4.9, schedule: '10/21', status: 'ongoing' },
  { id: 'c6', name: '品牌標準作業流程', category: '加盟營運', channel: 'franchise', enrolled: 40, completed: 36, satisfaction: 4.4, schedule: '10/25', status: 'upcoming' },
  { id: 'c7', name: '商品陳列與視覺行銷', category: '行銷企劃', channel: 'franchise', enrolled: 100, completed: 72, satisfaction: 4.6, schedule: '10/28', status: 'ongoing' },
  { id: 'c8', name: '加盟店財務管理', category: '財務管理', channel: 'franchise', enrolled: 60, completed: 41, satisfaction: 4.3, schedule: '11/01', status: 'upcoming' },
  { id: 'c9', name: '食品安全衛生規範', category: '法規合規', channel: 'both', enrolled: 120, completed: 108, satisfaction: 4.7, schedule: '10/15', status: 'done' },
  { id: 'c10', name: '員工領導力培訓', category: '領導管理', channel: 'both', enrolled: 55, completed: 50, satisfaction: 4.8, schedule: '10/12', status: 'done' },
  { id: 'c11', name: '數位行銷入門', category: '行銷企劃', channel: 'direct', enrolled: 70, completed: 51, satisfaction: 4.5, schedule: '10/30', status: 'upcoming' },
  { id: 'c12', name: '加盟店人力資源管理', category: '人力資源', channel: 'franchise', enrolled: 45, completed: 22, satisfaction: 4.2, schedule: '11/05', status: 'upcoming' },
];

export const GOOGLE_FORM_URL = 'https://docs.google.com/forms';

export const students: Student[] = [
  { id: 'st1', empNo: 'D10238', name: '王小明', store: '台北忠孝店', position: '店長', channel: '直營', hireDate: '2021-03-15', leaveDate: null, status: '在職', avatarColor: 'bg-mint-500' },
  { id: 'st2', empNo: 'D10456', name: '李雅芳', store: '桃園中正店', position: '副店長', channel: '直營', hireDate: '2022-07-01', leaveDate: null, status: '在職', avatarColor: 'bg-forest-500' },
  { id: 'st3', empNo: 'F20031', name: '陳俊宏', store: '高雄加盟一店', position: '加盟主', channel: '加盟', hireDate: '2020-11-20', leaveDate: null, status: '在職', avatarColor: 'bg-mint-600' },
  { id: 'st4', empNo: 'D10388', name: '林淑芬', store: '台中公益店', position: '資深店員', channel: '直營', hireDate: '2019-05-08', leaveDate: '2024-08-31', status: '離職', avatarColor: 'bg-forest-600' },
  { id: 'st5', empNo: 'F20152', name: '黃韻如', store: '台南加盟三店', position: '店員', channel: '加盟', hireDate: '2023-02-14', leaveDate: null, status: '在職', avatarColor: 'bg-mint-500' },
  { id: 'st6', empNo: 'D10577', name: '張志強', store: '台北信義店', position: '儲備店長', channel: '直營', hireDate: '2023-09-01', leaveDate: null, status: '在職', avatarColor: 'bg-forest-500' },
  { id: 'st7', empNo: 'F20098', name: '吳佩玲', store: '新竹加盟二店', position: '副加盟主', channel: '加盟', hireDate: '2021-12-10', leaveDate: null, status: '在職', avatarColor: 'bg-mint-600' },
];

export const studentCourses: StudentCourseRecord[] = [
  { id: 'sc1', studentId: 'st1', courseName: '門市服務品質提升實戰', category: '服務品質', enrollDate: '2025-09-01', completeDate: '2025-09-20', status: '已完成', score: 92, satisfaction: 4.8 },
  { id: 'sc2', studentId: 'st1', courseName: 'POS 系統進階操作', category: '系統操作', enrollDate: '2025-10-10', completeDate: null, status: '進行中', score: null, satisfaction: null },
  { id: 'sc3', studentId: 'st1', courseName: '員工領導力培訓', category: '領導管理', enrollDate: '2025-08-05', completeDate: '2025-08-30', status: '已完成', score: 88, satisfaction: 4.7 },
  { id: 'sc4', studentId: 'st1', courseName: '食品安全衛生規範', category: '法規合規', enrollDate: '2025-07-10', completeDate: '2025-07-25', status: '已完成', score: 95, satisfaction: 4.9 },
  { id: 'sc5', studentId: 'st2', courseName: '顧客關係管理 (CRM)', category: '顧客經營', enrollDate: '2025-09-15', completeDate: '2025-10-02', status: '已完成', score: 85, satisfaction: 4.6 },
  { id: 'sc6', studentId: 'st2', courseName: '門店營運數據分析', category: '數據分析', enrollDate: '2025-10-05', completeDate: null, status: '進行中', score: null, satisfaction: null },
  { id: 'sc7', studentId: 'st3', courseName: '加盟創業基礎營', category: '加盟營運', enrollDate: '2025-08-20', completeDate: '2025-09-10', status: '已完成', score: 90, satisfaction: 4.9 },
  { id: 'sc8', studentId: 'st3', courseName: '品牌標準作業流程', category: '加盟營運', enrollDate: '2025-10-01', completeDate: null, status: '進行中', score: null, satisfaction: null },
  { id: 'sc9', studentId: 'st3', courseName: '加盟店財務管理', category: '財務管理', enrollDate: '2025-06-10', completeDate: '2025-06-28', status: '已完成', score: 78, satisfaction: 4.3 },
  { id: 'sc10', studentId: 'st4', courseName: '食品安全衛生規範', category: '法規合規', enrollDate: '2024-05-01', completeDate: '2024-05-18', status: '已完成', score: 82, satisfaction: 4.5 },
  { id: 'sc11', studentId: 'st4', courseName: '門市服務品質提升實戰', category: '服務品質', enrollDate: '2024-06-10', completeDate: '2024-06-30', status: '未通過', score: 54, satisfaction: 3.8 },
  { id: 'sc12', studentId: 'st5', courseName: '商品陳列與視覺行銷', category: '行銷企劃', enrollDate: '2025-09-20', completeDate: '2025-10-08', status: '已完成', score: 89, satisfaction: 4.7 },
  { id: 'sc13', studentId: 'st6', courseName: '數位行銷入門', category: '行銷企劃', enrollDate: '2025-10-08', completeDate: null, status: '未開始', score: null, satisfaction: null },
  { id: 'sc14', studentId: 'st6', courseName: '員工領導力培訓', category: '領導管理', enrollDate: '2025-09-01', completeDate: '2025-09-25', status: '已完成', score: 91, satisfaction: 4.8 },
  { id: 'sc15', studentId: 'st7', courseName: '加盟店人力資源管理', category: '人力資源', enrollDate: '2025-09-12', completeDate: '2025-10-01', status: '已完成', score: 86, satisfaction: 4.5 },
];

export const studentExams: StudentExamRecord[] = [
  { id: 'se1', studentId: 'st1', examName: '服務品質認證測驗', examDate: '2025-09-22', score: 92, passed: true, attempt: 1 },
  { id: 'se2', studentId: 'st1', examName: '領導力評鑑', examDate: '2025-09-01', score: 70, passed: false, attempt: 1 },
  { id: 'se3', studentId: 'st1', examName: '領導力評鑑', examDate: '2025-09-15', score: 88, passed: true, attempt: 2 },
  { id: 'se4', studentId: 'st2', examName: 'CRM 系統操作測驗', examDate: '2025-10-04', score: 85, passed: true, attempt: 1 },
  { id: 'se5', studentId: 'st3', examName: '加盟營運資格考', examDate: '2025-09-12', score: 90, passed: true, attempt: 1 },
  { id: 'se6', studentId: 'st3', examName: '財務管理基礎測驗', examDate: '2025-06-30', score: 78, passed: true, attempt: 1 },
  { id: 'se7', studentId: 'st4', examName: '食品安全衛生測驗', examDate: '2024-05-20', score: 82, passed: true, attempt: 1 },
  { id: 'se8', studentId: 'st4', examName: '服務品質認證測驗', examDate: '2024-07-02', score: 54, passed: false, attempt: 1 },
  { id: 'se9', studentId: 'st5', examName: '視覺行銷實作測驗', examDate: '2025-10-10', score: 89, passed: true, attempt: 1 },
  { id: 'se10', studentId: 'st6', examName: '領導力評鑑', examDate: '2025-09-27', score: 91, passed: true, attempt: 1 },
  { id: 'se11', studentId: 'st7', examName: '人力資源管理測驗', examDate: '2025-10-03', score: 86, passed: true, attempt: 1 },
];
