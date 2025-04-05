<!-- 权限管理（admin） -->
<script setup lang="ts">
import { ref, watch, reactive, onMounted, computed } from 'vue'
import { getInfo, updateUserInfo, reqAllRole, batchDeleteUser, reqSetUserRole, removeUser } from '@/api/user'
import type { User, Role } from '@/types/user';
import { useSettingStore } from '@/stores/setting'
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { useTeamStore } from '@/stores/team';
import type { Task } from '@/types/task';
import type { Employee } from '@/types/team';
import dayjs from 'dayjs';
import { usernameRules, passwordRules, nameRules } from '@/hooks/useValidRule';

const teamStore = useTeamStore();
const userStore = useUserStore();

const loading = ref(false)
// 搜索框中的关键词
const keyWord = ref('');
// 存储与用户相关的参数
const userParams = ref({
  id: '',
  name: '',
  username: '',
  password: ''
});

// 分页参数
const pagination = reactive({
  page: 1,
  itemsPerPage: 10,
  totalItems: computed(() => userStore.users.length)
})
// 分页
const pageSize = ref(10);
// 当前页码
const pageNo = ref(1);
// 总页数
const total = ref(0);

// 用户批量删除操作时选中的用户的 ID
const delArr = ref<string[]>([]);
// 编辑对话框按钮显隐
const drawer = ref(false);
// 分配角色按钮对话框显隐
const drawer1 = ref(false);

// 全选角色的标记
const checkAllRole = computed({
  get: () => allRole.value.length > 0 &&
    allRole.value.every(r => userRole.value.includes(r.roleId)),
  set: (val: boolean) => {
    userRole.value = val
      ? allRole.value.map(r => r.roleId)
      : []
  }
})

// 当前用户的角色信息
const userRole = ref<string[]>([]);
// 所有角色的列表
const allRole = ref<Role[]>([]);

// 根据状态返回颜色
const statusColor = (status: string | undefined): string => {
  const colorMap: Record<string, string> = {
    '在职': 'green',
    '离职': 'red',
    '休假': 'orange',
  };
  return status && colorMap[status] ? colorMap[status] : 'grey'; // 默认返回灰色
};

// 根据状态返回图标
const statusIcon = (status: string | undefined): string => {
  const iconMap: Record<string, string> = {
    '在职': 'check_circle',
    '离职': 'cancel',
    '休假': 'person_celebrate',
  };
  return status && iconMap[status] ? iconMap[status] : 'help';
};

// 合并用户数据和团队员工数据
const mergedData = computed(() => {
  return userStore.users
    .map(user => {
      const employee = teamStore.employees.find(emp => emp.userId === user.userId);
      // 添加空值校验
      if (!employee || !employee.employeeId) {
        return null;
      }
      return {
        ...user,
        ...employee,
        userId: user.userId!, // 非空断言
        employeeId: employee.employeeId
      };
    })
    .filter(Boolean) as Array<{
      userId: string;
      employeeId: string;
      [key: string]: any
    }>;
});

// 加载用户列表
const loadUsers = async () => {
  await userStore.getUserList({
    keyword: keyWord.value,
    page: pagination.page,
    pageSize: pagination.itemsPerPage
  })
}

// 搜索用户
const search = () => {
  loadUsers();
};

// 清空搜索框
const refresh = () => {
  keyWord.value = '';
  loadUsers();
};

// 添加用户
const addUser = () => {
  userParams.value = { id: '', name: '', username: '', password: '' };
  drawer.value = true;
};

// 编辑用户
const updateUser = (item: any) => {
  userParams.value = { ...item };
  drawer.value = true;
};

// 保存用户信息
const save = async () => {
  try {
    if (userParams.value.id) {
      await updateUserInfo(userParams.value)
    } else {
      await userStore.createUser(userParams.value)
    }
    drawer.value = false
    await loadUsers()
  } catch (error) {
    console.error('操作失败:', error)
  }
}

// 打开角色分配对话框，传入当前用户数据，并准备分配角色
const setRole = (item: any) => {
  userParams.value = { ...item };
  // 初始化当前用户角色
  userRole.value = item.authorities || [];
  drawer1.value = true;
};

// 确认分配角色
const confirmClick = async () => {
  if (!userParams.value.id) return

  try {
    loading.value = true
    const currentUserId = userParams.value.id

    // 先获取当前用户的已有角色
    const userInfo = await getInfo()
    const originalRoles = userInfo.authorities || []

    // 计算需要添加和移除的角色
    const rolesToAdd = userRole.value.filter((id: string) => !originalRoles.includes(id))
    const rolesToRemove = originalRoles.filter((id: string) => !userRole.value.includes(id))

    // 并行处理所有角色变更
    await Promise.all([
      ...rolesToAdd.map((roleId: string) =>
        reqSetUserRole({ userId: currentUserId, roleId })
      ),
      ...rolesToRemove.map((roleId: string) =>
        reqSetUserRole({ userId: currentUserId, roleId: '' })
      )
    ])

    // 刷新数据
    await loadUsers()
    drawer1.value = false
    // 提示成功
  } catch (error) {
    console.error('角色分配失败:', error)
    // 提示错误
  } finally {
    loading.value = false
  }
}

// 批量删除操作。删除 delArr.value 中所有选中的用户
const deleteSelectUser = async () => {
  await userStore.batchRemoveUsers(delArr.value); // 直接使用已选userId
  // 清空选中
  delArr.value = [];
};

// 删除单个用户。通过 removeUser 方法删除指定的用户
const deleteUser = async (userId: string) => {
  const params = { userId };
  await removeUser(params);
};

// 加载角色列表
const loadRoles = async () => {
  try {
    const response = await reqAllRole();
    if (!response) {
      return;
    }
    allRole.value = response;
  } catch (error) {
    console.error('加载角色失败:', error);
  }
}

// 映射角色(权限-中文角色名)
const mapRoles = (authorities: string[]) => {
  if (!allRole.value || allRole.value.length === 0) {
    return '角色数据未加载'; // 返回默认值
  }
  return authorities
    .map(auth => {
      const role = allRole.value.find(r => r.roleId === auth);
      return role ? role.roleName : `未找到角色: ${auth}`; // 提供更多详细信息
    })
    .join(', ');
};

// watch(delArr, (newVal, oldVal) => {
//   console.log('旧值：', oldVal);
//   console.log('delArr 发生变化：', newVal);
// });

// 获取用户列表时，自动加载
onMounted(async () => {
  // 先加载员工数据
  await teamStore.getEmployees();
  // 再加载其他数据
  await Promise.all([loadUsers(), loadRoles()]);
});

</script>

<template>
  <v-container fluid>
    <!-- 搜索栏 -->
    <v-card class="mb-4 search-card">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" md="6">
            <v-text-field v-model="keyWord" density="compact" variant="outlined" label="请输入搜索"
              prepend-inner-icon="search" hide-details max-width="300px">
              <template v-slot:prepend>
                <span>用户名/姓名</span>
              </template>
            </v-text-field>
          </v-col>

          <v-col cols="12" md="6" class="text-end">
            <v-btn color="primary" class="mr-2" :disabled="!keyWord" @click="search" prepend-icon="search">搜索</v-btn>
            <v-btn variant="outlined" @click="refresh" prepend-icon="autorenew">重置</v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 操作栏 -->
    <v-card class="mb-4">
      <v-card-actions>
        <v-btn color="success" @click="addUser" prepend-icon="add">添加用户</v-btn>

        <v-dialog width="500">
          <!-- 激活按钮插槽 -->
          <template v-slot:activator="{ props }">
            <v-btn color="error" :disabled="delArr.length === 0" prepend-icon="delete" v-bind="props">批量删除</v-btn>
          </template>
          <!-- 对话框内容 -->
          <template v-slot:default="{ isActive }">
            <v-card title="确认删除">
              <v-card-text>
                <div v-if="delArr.length > 0">
                  <p>确定要删除以下 {{ delArr.length }} 个用户吗？</p>
                  <div class="user-list">
                    <!-- 遍历 delArr，显示每个被选中的用户 -->
                    <span v-for="user in delArr" :key="user" class="user-item">{{ user }}</span>
                  </div>
                </div>
              </v-card-text>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="error" text="确认" @click="deleteSelectUser(); isActive.value = false"></v-btn>
                <v-btn text="取消" @click="isActive.value = false"></v-btn>
              </v-card-actions>
            </v-card>
          </template>
        </v-dialog>

        <v-card-text>
          <span>已选中 {{ delArr.length }} 个用户</span>
        </v-card-text>
      </v-card-actions>
    </v-card>

    <!-- 用户表格 -->
    <v-card>
      <v-data-table v-model:items-per-page="pageSize" v-model:page="pageNo" :headers="[
        { title: '工号', key: 'employeeId', align: 'center' },
        { title: '用户名', key: 'username', align: 'center' },
        { title: '姓名', key: 'name', align: 'center' },
        {
          title: '用户角色', key: 'authorities', align: 'center',
        },
        { title: '职务', key: 'position', align: 'center' },
        {
          title: '在线状态', key: 'online', align: 'center',
        },
        {
          title: '在职状态', key: 'status', align: 'center',
        },
        { title: '调试', key: 'debug', align: 'center' },
        { title: '操作', key: 'actions', align: 'center', sortable: false }
      ]" :items="mergedData" show-select item-value="userId" v-model="delArr" @update:options="loadUsers"
        :items-length="total">
        <!-- 角色显示 -->
        <template v-slot:item.authorities="{ item }">
          <div class="d-flex align-center gap-1">
            <!-- 保证角色标签在水平线上对齐 -->
            <span class="role-text">{{ mapRoles(item.authorities!) }}</span>
            <v-chip v-for="(auth, index) in item.authorities" :key="index" small class="role-chip">
              {{ auth }}
            </v-chip>
          </div>
        </template>

        <!-- 职务显示 -->
        <template v-slot:item.online="{ item }">
          <v-chip :color="item.online ? 'success' : 'error'" variant="tonal"
            :prepend-icon="item.online ? 'check_circle' : 'cancel'" size="small" class="font-weight-medium">
            {{ item.online ? '在线' : '离线' }}
          </v-chip>
        </template>
        <!-- 状态显示 -->
        <template v-slot:item.status="{ item }">
          <v-chip :color="statusColor(item.status)" variant="flat" size="small" class="text-uppercase">
            <v-icon start :icon="statusIcon(item.status)" size="x-small"></v-icon>
            {{ item.status }}
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn icon="key" variant="text" color="primary" size="small" @click="setRole(item)"></v-btn>
          <v-btn icon="edit" variant="text" color="success" size="small" @click="updateUser(item)"></v-btn>
          <v-dialog width="500">
            <!-- 激活按钮插槽 -->
            <template v-slot:activator="{ props }">
              <v-btn icon="delete" variant="text" color="error" size="small" v-bind="props"></v-btn>
            </template>
            <!-- 对话框内容 -->
            <template v-slot:default="{ isActive }">
              <v-card title="确认删除">
                <v-card-text>
                  确定要删除用户 {{ item.username }} 吗？
                </v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn color="error" text="确认" @click="deleteUser(item.userId!); isActive.value = false"></v-btn>
                  <v-btn text="取消" @click="isActive.value = false"></v-btn>
                </v-card-actions>
              </v-card>
            </template>
          </v-dialog>
        </template>
      </v-data-table>

      <!-- 分页 -->
      <v-pagination v-model="pageNo" :length="Math.ceil(total / pageSize)" :total-visible="7"
        class="mt-4"></v-pagination>
    </v-card>

    <!-- 用户编辑对话框 -->
    <v-dialog v-model="drawer" max-width="600">
      <v-card class="edit-dialog">
        <v-toolbar color="indigo-darken-3" density="compact">
          <v-toolbar-title class="text-white">
            {{ userParams.id ? '编辑用户信息' : '新建用户' }}
          </v-toolbar-title>
          <v-btn icon @click="drawer = false">
            <v-icon color="white">close</v-icon>
          </v-btn>
        </v-toolbar>

        <v-card-text class="pa-6">
          <v-form @submit.prevent="save">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field v-model="userParams.name" label="姓名" variant="outlined" :rules="nameRules"
                  density="comfortable" />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field v-model="userParams.username" label="用户名" variant="outlined" :rules="usernameRules"
                  density="comfortable" />
              </v-col>

              <v-col cols="12">
                <v-text-field v-if="!userParams.id" v-model="userParams.password" label="初始密码" type="password"
                  variant="outlined" :rules="passwordRules" density="comfortable" />
              </v-col>
            </v-row>

            <v-divider class="my-4"></v-divider>

            <div class="text-end">
              <v-btn color="indigo-darken-3" type="submit" variant="flat">
                保存更改
              </v-btn>
              <v-btn variant="tonal" color="grey-darken-1" class="mr-2" @click="drawer = false">
                取消
              </v-btn>

            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- 分配角色对话框 -->
    <v-dialog v-model="drawer1" max-width="600">
      <v-card class="rounded-lg">
        <v-toolbar color="primary" density="compact">
          <v-toolbar-title class="text-white">
            <v-icon left>engineering</v-icon>
            角色分配
          </v-toolbar-title>
          <v-btn icon @click="drawer1 = false" :disabled="loading">
            <v-icon color="white">close</v-icon>
          </v-btn>
        </v-toolbar>

        <v-card-text class="pa-4">
          <!-- 用户信息 -->
          <v-text-field v-model="userParams.username" label="用户姓名" disabled variant="outlined"
            prepend-inner-icon="person"></v-text-field>

          <!-- 全选控件 -->
          <div class="d-flex align-center mb-2">
            <v-checkbox v-model="checkAllRole" :indeterminate="userRole.length > 0 && !checkAllRole" color="primary"
              :disabled="loading">
              <template v-slot:label>
                <span class="text-body-1 font-weight-medium">
                  全选
                </span>
              </template>
            </v-checkbox>
          </div>

          <v-divider class="my-3"></v-divider>

          <!-- 角色列表 -->
          <v-chip-group v-model="userRole" multiple column class="role-group">
            <v-chip v-for="role in allRole" :key="role.roleId" :value="role.roleId" filter label size="small"
              class="ma-1">
              {{ role.roleName }}
            </v-chip>
          </v-chip-group>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="flat" @click="confirmClick">
            确认
          </v-btn>
          <v-btn color="grey-darken-1" variant="text" @click="drawer1 = false" class="mr-2">
            取消
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.search-card {
  border-left: 4px solid #4ae2d0;
  background: linear-gradient(to right, #f8fbff, #ffffff);
}

.edit-dialog {
  .v-card-text {
    background: linear-gradient(145deg, rgb(211, 252, 201), #f8f9fa);
  }
}
.confirmation-card {
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

/* 用户列表 */
.user-list {
  display: flex; 
  flex-wrap: wrap; 
  gap: 15px; 
  margin-top: 10px;
}

/* 用户项样式 */
.user-item {
  padding: 8px 16px;
  background-color: #f0f0f0;
  border-radius: 25px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  font-weight: 600;
  color: #555;
  /* 添加鼠标悬停效果 */
  cursor: pointer;
  transition: background-color 0.3s ease;
}

/* 用户项悬停效果 */
.user-item:hover {
  background-color: #e0e0e0;
}

/* 使角色标签水平对齐 */
.d-flex {
  display: flex;
  align-items: center;
  /* 让内容垂直居中对齐 */
  gap: 8px;
  /* 标签之间的间距 */
}

/* 优化角色文本显示 */
.role-text {
  font-size: 0.875rem;
  /* 角色显示字体大小 */
  color: #333;
  /* 角色文本颜色 */
}

/* 优化角色标签外观 */
.role-chip {
  font-size: 0.875rem;
  /* 调整字体大小 */
  border-radius: 16px;
  /* 圆角效果 */
  padding: 4px 12px;
  /* 标签内边距 */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  /* 阴影效果 */
  transition: background-color 0.3s ease;
  /* 背景色过渡 */
  background-color: #f5f5f5;
  /* 设置一个浅色背景 */
  color: #126ec9;
  /* 标签字体颜色 */
}

/* 鼠标悬停时的效果 */
.role-chip:hover {
  background-color: #5ea0e3;
  color: white;
}

/* 交互效果(分配角色) */
.v-chip {
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.v-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
