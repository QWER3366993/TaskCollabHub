<script lang='ts' setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getNoticeDetailAndUpdateHit } from '@/api/notice'
import type { Notice, NoticeType } from '@/types/notice'
import dayjs from 'dayjs'
import DOMPurify from 'dompurify'

const route = useRoute()
const router = useRouter()
const notice = ref<Notice | null>(null)
const isLoading = ref(true) // 加载状态
const errorMessage = ref('') // 错误信息

// 类型映射工具
const typeConfig = {
    colors: {
        carousel: 'red',
        technology: 'blue',
        policy: 'green',
        other: 'grey'
    },
    labels: {
        carousel: '轮播公告',
        technology: '科技热点',
        policy: '政策法规',
        other: '其他公告'
    }
}

const getTypeColor = (type: NoticeType) => {
    return typeConfig.colors[type] || 'grey'
}

const getTypeLabel = (type: NoticeType) => {
    return typeConfig.labels[type] || '其他公告'
}

// HTML 处理
const sanitizeHTML = (html?: string) => {
    if (!html) return ''
    return DOMPurify.sanitize(html)
}

// 加载公告详情
const loadNoticeDetail = async () => {
    const noticeId = route.params.id as string
    if (!noticeId) {
        router.replace('/noticeboard1') // 如果 ID 不存在，跳回公告列表
        return
    }
    try {
        isLoading.value = true
        const response = await getNoticeDetailAndUpdateHit(noticeId)
        if (response) {
            notice.value = response
        } else {
            errorMessage.value = '公告不存在' // 明确设置错误信息
        }
    } catch (error) {
        errorMessage.value = '加载失败，请稍后重试' // 捕获网络错误
    } finally {
        isLoading.value = false // 无论成功失败都关闭加载状态
    }
}

onMounted(loadNoticeDetail)

</script>

<template>
    <v-container class="notice-detail">
        <!-- 加载中状态 -->
        <v-progress-circular v-if="isLoading" indeterminate color="primary" class="mx-auto d-block my-12" />

        <!-- 成功状态 -->
        <v-card v-else-if="notice" class="elevation-6">
            <!-- 封面图 -->
            <v-img :src="notice.coverImage || '/default-cover.jpg'" :aspect-ratio="16 / 9" cover class="cover-image">
                <div class="cover-overlay pa-4 d-flex flex-column justify-space-between">
                    <!-- 类型标签 -->
                    <v-chip label :color="getTypeColor(notice.type)" class="align-self-start">
                        {{ getTypeLabel(notice.type) }}
                    </v-chip>

                    <!-- 标题区 -->
                    <div class="header-content">
                        <h1 class="text-h3 font-weight-bold text-white">
                            {{ notice.title }}
                        </h1>
                        <div class="meta-info">
                            <div class="text-subtitle-1 text-white">
                                <v-icon color="white">schedule</v-icon>
                                {{ dayjs(notice.createdAt).format('YYYY年MM月DD日') }}
                            </div>
                            <div class="text-subtitle-1 text-white">
                                <v-icon color="white">visibility</v-icon>
                                浏览量 {{ notice.hit }}
                            </div>
                        </div>
                    </div>
                </div>
            </v-img>

            <!-- 正文内容 -->
            <v-card-text class="content-wrapper">
                <!-- 摘要 -->
                <blockquote v-if="notice.summary" class="summary-box">
                    {{ notice.summary }}
                </blockquote>

                <!-- 外链 -->
                <v-alert v-if="notice.url" type="info" variant="tonal" class="my-4">
                    <template v-slot:prepend>
                        <v-icon color="info">share</v-icon>
                    </template>
                    <a :href="notice.url" target="_blank" class="text-decoration-none">
                        相关链接：{{ notice.url }}
                    </a>
                </v-alert>

                <!-- 正文内容 -->
                <div class="content-html" v-html="sanitizeHTML(notice.content)"></div>
            </v-card-text>

            <!-- 操作按钮 -->
            <v-card-actions class="px-4 pb-4">
                <v-btn color="primary" variant="tonal" @click="router.push('/noticeboard1')">
                    <v-icon start>undo</v-icon>
                    返回列表
                </v-btn>
            </v-card-actions>
        </v-card>

        <!-- 失败状态 -->
        <v-alert v-else-if="errorMessage" type="error" prominent class="mt-8">
            {{ errorMessage }}
            <template v-slot:append>
                <v-btn color="white" variant="text" @click="router.replace('/noticeboard1')">
                    返回列表
                </v-btn>
            </template>
        </v-alert>
    </v-container>
</template>

<style lang="scss" scoped>
.notice-detail {
    max-width: 1300px;
    margin: 0 auto;

    .cover-image {
        position: relative;

        .cover-overlay {
            background: linear-gradient(to top, rgba(120, 120, 120, 0.7) 20%, transparent);
            height: 100%;
        }
    }

    .header-content {
        margin-top: auto;

        h1 {
            line-height: 1.2;
            text-shadow: 0 16px 3px rgba(52, 52, 52, 0.5);
        }

        .meta-info {
            display: flex;
            gap: 1.5rem;
            margin-top: 1rem;
            opacity: 0.9;
        }
    }

    .content-wrapper {
        font-size: 1.1rem;
        line-height: 1.8;
    }
}
</style>