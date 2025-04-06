<script lang="ts" setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useTeamStore } from '@/stores/team';
import { useRouter } from 'vue-router';
import { getSchedules, createSchedule, updateSchedule, deleteSchedule } from '@/api/team';
import { useUserStore } from '@/stores/user';
import { createToast } from 'mosha-vue-toastify';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DateClickArg } from '@fullcalendar/interaction';
import type { Team, Employee, Schedule } from '@/types/team';
// 中文语言包导入
import zhLocale from '@fullcalendar/core/locales/zh-cn'

// 变量声明
const userStore = useUserStore();
const teamStore = useTeamStore();
const router = useRouter();

// 日程事件变量
const selectedDate = ref(null);
const calendarEvents = ref<any[]>([]); // 存储日历事件（任务和通知）
const selectedDateSchedules = ref<any[]>([]);
const isScheduleListDialogOpen = ref(false);

// 日程创建和编辑相关变量
const scheduleTitle = ref('');
const scheduleDate = ref('');
const scheduleTime = ref('');
const selectedParticipants = ref<string[]>([]);

// 设置通知对话框状态和内容
const notificationDialog = ref(false);
const notificationContent = ref('');

// 管理员权限判断
const isAdmin = computed(() =>
  userStore.user?.authorities?.includes('admin') ||
  userStore.user?.authorities?.includes('manager')
);

// 日程表单对话框
const scheduleDialog = ref(false)

const isEditing = ref(false)
const currentSchedule = ref<Partial<Schedule>>({
  title: '',
  date: new Date().toISOString().split('T')[0],
  time: '09:00',
  participants: []
})
// 打开新增日程对话框
const openCreateDialog = () => {
  currentSchedule.value = {
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    participants: []
  }
  isEditing.value = false
  scheduleDialog.value = true
}

// 打开编辑对话框
const openEditDialog = (scheduleId: string) => {
  const event = calendarEvents.value.find(e => e.id === scheduleId)
  if (event) {
    currentSchedule.value = {
      id: event.id,
      title: event.title,
      date: event.start.split('T')[0],
      time: event.extendedProps.time === '全天' ? '' : event.start.split('T')[1]?.substring(0, 5),
      participants: event.extendedProps.participants
    }
    isEditing.value = true
    scheduleDialog.value = true
  }
}
// 统一提交处理
const handleSubmit = async () => {
  if (!currentSchedule.value) return

  try {
    const scheduleData = {
      ...currentSchedule.value,
      time: currentSchedule.value.time || null
    }

    if (isEditing.value) {
      await updateSchedule(currentSchedule.value.id!, scheduleData)
      createToast('日程更新成功', { type: 'success' })
    } else {
      await createSchedule(scheduleData)
      createToast('日程创建成功', { type: 'success' })
    }

    scheduleDialog.value = false
    await loadSchedules()
  } catch (error) {
    console.error('操作失败:', error)
    createToast('操作失败，请重试', { type: 'danger' })
  }
}

// 加载日程事件
const loadCalendarEvents = async () => {
  try {
    const response = await getSchedules();
    calendarEvents.value = response.data.map((schedule: Schedule) => ({
      id: schedule.id,
      title: schedule.title,
      start: schedule.time
        ? `${schedule.date}T${schedule.time}`
        : schedule.date, // 处理全天事件
      allDay: !schedule.time, // 没有时间则为全天事件
      extendedProps: {
        participants: schedule.participants,
        time: schedule.time || '全天'
      }
    }));
  } catch (error) {
    console.error('加载日程失败:', error);
  }
};

// 加载日程列表
const loadSchedules = async () => {
  await loadCalendarEvents(); // 重新加载日程
};

// 删除日程
const removeSchedule = async (scheduleId: string) => {
  try {
    await deleteSchedule(scheduleId);  // 调用API删除
    createToast('日程已删除', { type: 'success' });
    loadSchedules();  // 刷新日程
  } catch (error) {
    console.error('删除日程失败', error);
  }
};

const confirmDelete = (id: string) => {
  if (confirm('确定要永久删除这个日程吗？此操作不可撤销！')) {
    removeSchedule(id)
  }
}

// 查看日程详情
const viewScheduleDetails = (schedule: any) => {
  if (schedule.type === 'task') {
    // 跳转到任务详情页面
    router.push({ name: 'teamdetail', params: { taskId: schedule.id } });
  } else if (schedule.type === 'notification') {
    // 显示通知对话框
    notificationDialog.value = true;
    notificationContent.value = schedule.content;
  }
};

// 自定义事件内容渲染
const renderEventContent = (eventInfo: any) => {
  return {
    html: `
      <div class="fc-event-content">
        <i class="fc-event-icon ${eventInfo.event.extendedProps.type === 'task' ? 'mdi mdi-checkbox-marked' : 'mdi mdi-bell'}"></i>
        <span class="fc-event-title">${eventInfo.event.title}</span>
      </div>
    `
  };
};

// 事件点击处理
const handleEventClick = (info: any) => {
  const event = info.event;
  notificationContent.value = event.title;
  notificationDialog.value = true;
};

// 日期点击处理：显示当天日程
const handleDateClick = (arg: DateClickArg) => {
  const clickedDate = arg.dateStr;
  // 筛选当前日期的所有事件（考虑时区）
  const eventsOnDate = calendarEvents.value.filter(event => {
    const eventDate = event.start?.split('T')[0];
    return eventDate === clickedDate;
  });
  selectedDateSchedules.value = eventsOnDate;
  isScheduleListDialogOpen.value = true;
}
// 日历配置
const calendarOptions = ref({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: computed(() => {
      // 动态生成右上角按钮
      const buttons = ['dayGridMonth', 'timeGridWeek', 'timeGridDay'];
      if (isAdmin.value) {
        buttons.push('newScheduleButton'); // 自定义按钮名称
      }
      return buttons.join(','); // 转换为字符串
    }),
  },
  customButtons: { // 定义自定义按钮
    newScheduleButton: {
      text: '新建日程',
      click: openCreateDialog,
    },
  },
  events: calendarEvents, // 使用已加载的事件
  eventClick: handleEventClick,
  dateClick: handleDateClick,
  eventContent: renderEventContent,
  dayCellContent: (args: any) => {
    const dateStr = args.date.toISOString().split('T')[0];
    const hasEvent = calendarEvents.value.some((event: any) => {
      const eventDate = event.start?.split('T')[0];
      return eventDate === dateStr;
    });
    return {
      html: `
        <div class="fc-day-cell">
          ${args.dayNumberText}
          ${hasEvent ? '<span class="event-dot"></span>' : ''}
        </div>
      `
    };
  },
  locales: [zhLocale],
  locale: 'zh-cn',
  buttonText: {
    today: '今天',
    month: '月视图',
    week: '周视图',
    day: '日视图'
  },
  height: 'auto', // 自适应高度
  fixedWeekCount: false, // 不固定显示6周
  handleWindowResize: true, // 启用自动窗口resize处理
});

// 添加员工姓名转换逻辑
const getParticipantNames = (ids: string[]) => {
  return ids.map(id =>
    teamStore.employees.find(e => e.employeeId === id)?.name || '未知成员'
  ).join(', ');
};

// 监听并加载员工数据
onMounted(async () => {
  await userStore.getUserInfo();
  await teamStore.getEmployees();
  await loadSchedules();  // 加载日程数据
});
</script>

<template>
  <div>
    <!-- 日程通知弹窗 -->
    <v-dialog v-model="notificationDialog" max-width="500px">
      <v-card class="rounded-xl">
        <v-card-title class="text-h5 primary--text bg-blue-lighten-5">
          <v-icon icon="event" class="mr-2"></v-icon>
          日程提醒
        </v-card-title>
        <v-card-text class="pa-6 text-body-1">
          {{ notificationContent }}
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="notificationDialog = false" class="px-6">
            我知道了
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 日程详情弹窗 -->
    <v-dialog v-model="isScheduleListDialogOpen" max-width="600px">
      <v-card class="rounded-xl">
        <v-card-title class="text-h5 bg-blue-lighten-5">
          <v-icon icon="today" class="mr-2"></v-icon>
          {{ selectedDateSchedules[0]?.start.split('T')[0] }} 的日程
        </v-card-title>
        <v-card-text class="pa-4">
          <v-list v-if="selectedDateSchedules.length > 0" class="py-2">
            <v-list-item v-for="event in selectedDateSchedules" :key="event.id" @click="viewScheduleDetails(event)"
              class="mb-2" variant="outlined">
              <template v-slot:append v-if="isAdmin">
                <v-btn class="admin-action" icon="edit" variant="text" @click.stop="openEditDialog(event.id)"></v-btn>
                <v-btn class="admin-action" icon="delete" color="error" variant="text"
                  @click.stop="confirmDelete(event.id)"></v-btn>
              </template>
              <template v-slot:prepend>
                <v-icon :icon="event.extendedProps.time === '全天' ? 'more_time' : 'timer'"
                  :color="event.extendedProps.time === '全天' ? 'primary' : 'orange'" class="mr-3"></v-icon>
              </template>
              <v-list-item-title class="font-weight-medium">{{ event.title }}</v-list-item-title>
              <v-list-item-subtitle>
                时间：{{ event.extendedProps.time }}
              </v-list-item-subtitle>
              <v-list-item-subtitle class="text-caption">
                <div class="d-flex align-center mt-1">
                  <v-icon icon="group" size="small" class="mr-1"></v-icon>
                  参与人：{{ getParticipantNames(event.extendedProps.participants) }}
                </div>
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
          <div v-else class="text-center py-6 text-grey">
            <div>当日没有日程安排</div>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="isScheduleListDialogOpen = false" class="px-6">
            关闭
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 日历容器 -->
    <div class="calendar-wrapper pa-4">
      <FullCalendar class="custom-calendar" :options="calendarOptions" />
    </div>
  </div>

  <!-- 新增/编辑日程对话框 -->
  <v-dialog v-model="scheduleDialog" max-width="600px">
    <v-card class="rounded-lg">
      <v-card-title class="d-flex align-center">
        <v-icon icon="edit" class="mr-2"></v-icon>
        {{ isEditing ? '编辑日程' : '新建日程' }}
      </v-card-title>
      <v-card-text>
        <v-form @submit.prevent="handleSubmit">
          <v-text-field v-model="currentSchedule.title" label="日程标题" required
            :rules="[v => !!v || '标题不能为空']"></v-text-field>

          <v-row>
            <v-col cols="6">
              <v-text-field v-model="currentSchedule.date" label="日期" type="date" required
                :rules="[v => !!v || '请选择日期']"></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field v-model="currentSchedule.time" label="时间" type="time"
                :disabled="!currentSchedule.time"></v-text-field>
            </v-col>
          </v-row>

          <v-combobox v-model="currentSchedule.participants" :items="teamStore.employees" item-title="name"
            item-value="employeeId" label="参与人员" multiple chips :rules="[v => v.length > 0 || '至少选择一个参与者']">
            <template v-slot:selection="{ item }">
              <v-chip>{{ item.title }}</v-chip>
            </template>
          </v-combobox>

          <v-card-actions class="pa-4">
            <v-spacer></v-spacer>
            <v-btn color="primary" type="submit">{{ isEditing ? '更新' : '创建' }}</v-btn>
            <v-btn color="secondary" @click="scheduleDialog = false">取消</v-btn>
          </v-card-actions>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
.calendar-wrapper {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 30px 50px rgba(222, 119, 9, 0.05);
  width: 100%;


}

// 深度样式覆盖
:deep(.custom-calendar) {

  /* 关键修正4 - 锁定列宽 */
  .fc-col-header-cell,
  .fc-daygrid-day {
    width: 50px !important; // 固定列宽
    height: 50px !important; // 固定行高
  }

  // 工具栏样式
  .fc-toolbar {
    padding: 1rem;
    background: rgb(244, 238, 200);
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
    width: 100% !important;
    /* 确保宽度100% */
    height: 100% !important;

    .fc-button {
      border-radius: 6px;
      text-transform: capitalize;
      transition: all 0.2s;
      &:hover {
        transform: translateY(-1px);
      }
    }
  }

  // 日期单元格
  .fc-daygrid-day {
    transition: background 0.2s;

    &:hover {
      background: #a3e0d7;
    }
  }

  // 事件样式
  .fc-event {
    border-radius: 5px;
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    padding: 4px 8px;

    &-title {
      font-weight: 500;
    }
  }

  // 今日样式
  .fc-day-today {
    background: rgba(33, 150, 243, 0.1) !important;
  }

  // 头部样式
  .fc-col-header-cell {
    background: #e7f4d0;
    padding: 8px 0;
    font-weight: 500;
  }
}

/* 管理员操作按钮样式 */
.admin-action {
  opacity: 0;
  transition: opacity 0.2s;
}

.v-list-item:hover .admin-action {
  opacity: 1;
}

/* 优化日期时间输入样式 */
:deep(.v-input--date-picker .v-input__control),
:deep(.v-input--time-picker .v-input__control) {
  max-width: 200px;
}

/* 优化组合框样式 */
:deep(.v-combobox__selection) {
  flex-wrap: wrap;
  gap: 4px;
}
</style>