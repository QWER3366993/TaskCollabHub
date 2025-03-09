import service from '@/utils/request';
import type { Project, ProjectCreateDTO } from '@/types/project';

export const createProject = async (project: ProjectCreateDTO): Promise<Project> => {
    // 创建项目（批量任务）
    const response = await service({
        url: '/projects/batch',
        method: 'post',
        data: project
    });
    return response.data;
};

//更新项目
export const updateOldProject = async (id: string, updatedProject: Partial<Project>): Promise<Project> => {
    const response = await service({
        url: `/api/projects/${id}`,
        method: 'patch',
        data: updatedProject,
    });
    return response.data;
};

// 获取团队项目列表
export const fetchProjects = async (teamId: string): Promise<Project[]> => {
    const response = await service({
        url: `/projects?teamId=${teamId}`,
        method: 'get'
    });
    return response.data;
};

