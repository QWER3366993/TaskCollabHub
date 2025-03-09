import { defineStore } from 'pinia'
import { ref } from 'vue';
import type { Project, ProjectCreateDTO } from '@/types/project';
import { fetchProjects, updateOldProject, createProject } from '@/api/project';
import { createToast } from 'mosha-vue-toastify';

export const useProjectStore = defineStore('project', () => {
  const projects = ref<Project[]>([]);
  const currentProject = ref<Project | null>(null);
  const errorMessage = ref<string>('');

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

  const createNewProject = async (project: ProjectCreateDTO): Promise<Project> => {
    try {
      const newProject = await createProject(project);
      projects.value.push(newProject);
      createToast('任务创建成功', { position: 'top-center', showIcon: true, type: 'success' });
      return newProject;
    } catch (error) {
      errorMessage.value = '创建任务失败';
      createToast(errorMessage.value, { position: 'top-center', showIcon: true, type: 'danger' });
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