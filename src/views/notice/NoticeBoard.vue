<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNoticeStore } from '@/stores/notice'
import { useUserStore } from '@/stores/user'
import { getNoticesByType, addNoticeHit, add, update, del } from '@/api/notice'
import dayjs from 'dayjs'
import type { Notice, NoticeType } from '@/types/notice'
import ArticleEditor from '@/views/notice/ArticleEditor.vue'
import service from '@/utils/request'
import { createToast } from 'mosha-vue-toastify'

const router = useRouter()
const noticeStore = useNoticeStore()
const userStore = useUserStore()

// 管理员状态
const isAdmin = computed(() => userStore.user?.authorities?.includes('admin'))

const searchKeyword = ref('')
const currentCategory = ref('technology') // 当前类别（默认科技热点）

const deleteDialog = ref(false)
const deletingId = ref<string | null>(null)

const coverImageFile = ref<File | null>(null)
// 当前编辑的公告ID（null表示新增）
const currentEditId = ref<string | null>(null)
// 表单校验状态
const isFormValid = computed(() => {
  return !!newArticle.value.title &&
    !!newArticle.value.type &&
    !!newArticle.value.content
})

const handleCoverUpload = async () => {
  if (!coverImageFile.value) return

  try {
    const formData = new FormData()
    formData.append('file', coverImageFile.value)

    const res = await service.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    newArticle.value.coverImage = res.data.url
  } catch (error) {
    console.error('封面图上传失败:', error)
  }
}

// 详情页状态管理
const editorDialog = ref(false)


// 面包屑导航
const breadcrumbs = computed(() => [
  { text: '首页', to: '/' },
  { text: currentCategory.value }
])

// 加载公告数据
const loadNotices = async () => {
  await noticeStore.loadNotices()
}

// 查看公告详情
const viewDetail = async (notice: Notice) => {
  try {
    await addNoticeHit(notice.id)
    router.push({
      name: 'noticedetail',
      params: { id: notice.id }
    })
  } catch (error) {
    console.error('记录点击量失败:', error)
  }
}

// 打开编辑器（新增/编辑）
const openEditor = (notice?: Notice) => {
  if (notice) {
    currentEditId.value = notice.id
    newArticle.value = { ...notice }
  } else {
    currentEditId.value = null
    newArticle.value = {
      title: '',
      type: 'technology' as NoticeType,
      content: '',
      coverImage: '',
      url: '',
      summary: ''
    }
  }
  editorDialog.value = true
}

// 管理员操作
const newArticle = ref<Omit<Notice, 'id' | 'hit' | 'createdAt'>>({
  title: '',
  type: 'technology',
  content: '',
  summary: '',
  coverImage: '',
  url: ''
})

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.random() * 16 | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

// 添加公告（管理员）
const submitNotice = async () => {
  if (!isFormValid.value) {
    createToast('请填写所有必填字段', {
      type: 'danger',
      timeout: 3000,
      position: 'top-right'
    })
    return
  }
  try {
    // 查找原始数据（如果是编辑）
    const originalNotice = currentEditId.value
      ? [...noticeStore.techNotices, ...noticeStore.policyNotices, ...noticeStore.carouselNotices]
        .find(n => n.id === currentEditId.value)
      : null;
    const payload: Notice = {
      id: currentEditId.value || generateUUID(),
      title: newArticle.value.title,
      type: newArticle.value.type,
      content: newArticle.value.content || '',
      summary: newArticle.value.summary || '',
      hit: originalNotice?.hit || 0, // 保留原有点击量
      createdAt: originalNotice?.createdAt || new Date().toISOString(), // 保留创建时间
      url: newArticle.value.url,
      coverImage: newArticle.value.coverImage || '/default-cover.jpg'
    }
    if (currentEditId.value) {
      await update(payload, noticeStore.listUrl,)
    } else {
      await add(payload, noticeStore.listUrl)
    }
    editorDialog.value = false
    loadNotices()
  } catch (error) {
    console.error('操作失败:', error)
    createToast(currentEditId.value ? '更新失败' : '发布失败', {
      type: 'danger',
      timeout: 2000
    })
  }
}

// 删除确认
const confirmDelete = (noticeId: string) => {
  deletingId.value = noticeId;
  deleteDialog.value = true;
};
// 执行删除
const handleDelete = async () => {
  if (!deletingId.value) return
  try {
    await noticeStore.deleteNotice(deletingId.value)
    createToast('删除成功', { type: 'success' })
  } catch (error) {
    createToast('删除失败', { type: 'danger' })
  } finally {
    deleteDialog.value = false
  }
}

// 初始化加载
onMounted(async () => {
  userStore.getUserInfo(); //初始时加载登录用户信息
  await loadNotices()
});
</script>

<template>
  <div class="news-container">
    <!-- 轮播图区域 -->
    <v-carousel progress="primary" show-arrows="hover" hide-delimiters cycle interval="5000" height="500">
      <v-carousel-item v-for="item in noticeStore.carouselNotices" :key="item.id" :src="item.coverImage"
        :aspect-ratio="16 / 9" cover loading="lazy">
        <div class="carousel-overlay" @click="viewDetail(item)">
          <div class="carousel-content">
            <h2 class="text-h4 font-weight-bold mb-4">{{ item.title }}</h2>
            <p>{{ item.summary }}</p>
          </div>
          <v-card-actions v-if="isAdmin">
            <v-btn class="action-btn" color="primary" icon="edit" variant="tonal" @click.stop="openEditor(item)"
              style="margin-bottom: 120px;"></v-btn>
            <v-btn class="action-btn" color="error" icon="delete" variant="tonal"
              @click.stop="confirmDelete(item.id)"></v-btn>
          </v-card-actions>
        </div>
      </v-carousel-item>
    </v-carousel>

    <!-- 双栏新闻区 -->
    <v-container class="bothNotice my-8">
      <v-row>
        <!-- 科技新闻 -->
        <v-col cols="12" md="6">
          <h3 class="text-h5 mb-4">
            <v-icon color="blue">radar</v-icon>
            科技热点
          </h3>
          <div class="news-list">
            <v-card v-for="notice in noticeStore.techNotices" :key="notice.id" class="news-card mb-4"
              @click="viewDetail(notice)">
              <v-card-title>{{ notice.title }}</v-card-title>
              <v-card-subtitle>
                <v-icon small>schedule</v-icon>
                {{ dayjs(notice.createdAt).format('YYYY-MM-DD') }}
                <v-spacer />
                <v-icon small>visibility</v-icon>
                {{ notice.hit }}
              </v-card-subtitle>
              <v-card-text>{{ notice.summary }}</v-card-text>
              <!-- 编辑删除按钮 -->
              <v-card-actions v-if="isAdmin">
                <v-spacer />
                <v-btn color="primary" icon="edit" variant="tonal" @click.stop="openEditor(notice)">
                </v-btn>
                <v-btn color="error" icon="delete" variant="tonal" @click.stop="confirmDelete(notice.id)">
                </v-btn>
              </v-card-actions>
            </v-card>
          </div>
        </v-col>

        <!-- 政策新闻 -->
        <v-col cols="12" md="6">
          <h3 class="text-h5 mb-4">
            <v-icon color="green">local_police</v-icon>
            政策法规
          </h3>
          <div class="news-list">
            <v-card v-for="notice in noticeStore.policyNotices" :key="notice.id" class="news-card mb-4"
              @click="viewDetail(notice)">
              <v-card-title>{{ notice.title }}</v-card-title>
              <v-card-subtitle>
                <v-icon small>schedule</v-icon>
                {{ dayjs(notice.createdAt).format('YYYY-MM-DD') }}
                <v-spacer />
                <v-icon small>visibility</v-icon>
                {{ notice.hit }}
              </v-card-subtitle>
              <v-card-text>{{ notice.summary }}</v-card-text>
              <!-- 编辑删除按钮 -->
              <v-card-actions v-if="isAdmin">
                <v-spacer />
                <v-btn color="primary" icon="edit" variant="tonal" @click.stop="openEditor(notice)">
                </v-btn>
                <v-btn color="error" icon="delete" variant="tonal" @click.stop="confirmDelete(notice.id)">
                </v-btn>
              </v-card-actions>
            </v-card>
          </div>
        </v-col>
      </v-row>
    </v-container>

    <v-btn v-if="isAdmin" class="admin-toolbar" density="compact" @click="openEditor">
      <v-icon>add</v-icon>
      新建公示公告
    </v-btn>
    <!-- 编辑器弹窗 -->
    <v-dialog v-model="editorDialog" max-width="800px">
      <v-card>
        <v-card-title class="d-flex align-center">
          公告管理
          <v-chip color="warning" size="small" class="ml-2">* 为必填项</v-chip>
        </v-card-title>
        <v-card-text>
          <!-- 标题 -->
          <v-text-field v-model="newArticle.title" label="公告标题 *" :rules="[v => !!v || '标题不能为空']"
            required></v-text-field>
          <v-select v-model="newArticle.type" label="公告类型 *" :items="[
            { text: '轮播公告', value: 'carousel' },
            { text: '科技热点', value: 'technology' },
            { text: '政策法规', value: 'policy' },
            { text: '其他公告', value: 'other' }
          ]" item-title="text" item-value="value" :rules="[v => !!v || '请选择公告类型']" required></v-select>

          <!-- 封面图上传 -->
          <v-file-input v-model="coverImageFile" label="封面图片" accept="image/*" prepend-icon="image"
            @change="handleCoverUpload">
            <template v-slot:append>
              <v-chip v-if="newArticle.coverImage" color="success" size="small">
                已上传封面图
              </v-chip>
            </template>
          </v-file-input>

          <!-- 外部链接 -->
          <v-text-field v-model="newArticle.url" label="相关链接" placeholder="https://example.com"
            prepend-icon="link"></v-text-field>

          <!-- 摘要 -->
          <v-textarea v-model="newArticle.summary" label="内容摘要" placeholder="请输入不超过200字的摘要" :counter="200" rows="3"
            prepend-icon="summarize"></v-textarea>
          <!-- 正文编辑器 -->
          <div class="editor-section">
            <h4 class="text-subtitle-1 mb-2">
              公告正文 *
              <v-chip color="grey" size="x-small">使用下方编辑器编写详细内容</v-chip>
            </h4>
            <ArticleEditor v-model="newArticle.content" :rules="[(v: string) => !!v || '正文内容不能为空']" />
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="submitNotice" :disabled="!isFormValid">
            {{ currentEditId ? '更新公告' : '发布公告' }}
          </v-btn> <v-btn color="grey" @click="editorDialog = false">取消</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 删除确认对话框 -->
    <v-dialog v-model="deleteDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5">
          确认删除？
        </v-card-title>
        <v-card-text>
          该操作不可逆，确定要删除此公告吗？
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="error" @click="handleDelete">
            确认删除
          </v-btn>
          <v-btn color="grey" @click="deleteDialog = false">
            取消
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
/* 轮播公告容器 */
.carousel-overlay {
  height: 100%;
  display: flex;
  align-items: flex-end;
  padding: 2rem;
}

/* 轮播公告样式 */
.carousel-content {
  color: white;
}

.bothNotice {
  margin-left: 0px;
  max-width: 100%;
}

/* 卡片样式 */
.v-card {
  transition: transform 0.3s;
  cursor: pointer;
}

/* 鼠标悬停时，卡片上移并增加阴影 */
.v-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 新闻列表固定高度（启用滚动条） */
.news-list {
  max-height: 350px;
  /* 限制高度 */
  overflow-y: auto;
  /* 启用滚动条 */
  padding-right: 10px;
}

/* 自定义滚动条 */
.news-list::-webkit-scrollbar {
  width: 6px;
}

.news-list::-webkit-scrollbar-thumb {
  background-color: #cff3e3;
  /* 滑块背景颜色 */
  border-radius: 3px;
  /* 滑块圆角 */
  opacity: 0.5;
  /* 滑块透明度 */
}

.news-list::-webkit-scrollbar-track {
  background-color: #bef4ba;
  /* 轨道背景颜色 */
}

/* 编辑删除操作按钮 */
.action-btn {
  position: absolute;
  right: 16px;
  backdrop-filter: blur(2px);
}

.admin-toolbar {
  position: fixed;
  /* 固定在页面 */
  bottom: 20px;
  /* 离底部20px */
  right: 20px;
  background: rgba(149, 166, 210, 0.8) !important;
  backdrop-filter: blur(4px);
  border-bottom: 1px solid rgba(66, 72, 86, 0.12);
  border-radius: 24px;
  /* 圆角 */
}
</style>
