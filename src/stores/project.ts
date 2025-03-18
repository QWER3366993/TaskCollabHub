import { defineStore } from 'pinia'
import { ref } from 'vue';
import type { Project, ProjectCreateDTO } from '@/types/project';
import { fetchProjects, updateOldProject, createProject } from '@/api/project';
import { createToast } from 'mosha-vue-toastify';
import type { Task, TaskCreateDTO } from '@/types/task';
import { useTaskStore } from '@/stores/task';

export const useProjectStore = defineStore('project', () => {
  const projects = ref<Project[]>([]);
  const currentProject = ref<Project | null>(null);
  const errorMessage = ref<string>('');
  const tasks = ref<Task[]>([]);
  const getAllProjects = async (teamId: string) => {
    try {
      const data = await fetchProjects(teamId);
      projects.value = data;
      return data;
    } catch (error) {
      console.error('获取项目列表失败:', error);
    }
  };

  /** 更新项目 */
  const updateProject = async (projectId: string, updatedProject: Partial<Project>): Promise<void> => {
    try {
      const updatedProjectResponse = await updateOldProject(projectId, updatedProject);
      const projectIndex = projects.value.findIndex((project) => project.id === projectId);
      if (projectIndex !== -1) {
        projects.value[projectIndex] = { ...projects.value[projectIndex], ...updatedProject };
      }

      createToast('项目更新成功', { position: 'top-center', showIcon: true, type: 'success' });
    } catch (error) {
      errorMessage.value = '更新项目失败';
      createToast(errorMessage.value, { position: 'top-center', showIcon: true, type: 'danger' });
    }
  };

  const createNewProject = async (
    project: ProjectCreateDTO,
    taskData: TaskCreateDTO[]
  ): Promise<Project> => {
    try {
      // 1. 创建项目
      const newProject = await createProject(project);
      // 2. 批量创建关联任务
      if (tasks.value.length > 0) {
        const taskStore = useTaskStore();
        // 并行创建任务
        const createPromises = tasks.value.map(task =>
          taskStore.createNewTask({
            ...task,
            projectId: newProject.id // 注入项目ID
          })
        );
        await Promise.all(createPromises);
      }
      createToast('项目创建成功', {
        position: 'top-center',
        showIcon: true,
        type: 'success'
      });
      return newProject;
    } catch (error) {
      errorMessage.value = '创建项目失败';
      createToast(errorMessage.value, {
        position: 'top-center',
        showIcon: true,
        type: 'danger'
      });
      throw error;
    }
  };

  return {
    projects,
    currentProject,
    getAllProjects,
    updateProject,
    createNewProject
  };
});