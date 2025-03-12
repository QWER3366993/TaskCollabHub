import type { MockMethod } from 'vite-plugin-mock';

export default [
  {
    url: '/employees',
    method: 'get',
    response: () => {
      return [
        { employeeId: 'u111', name: '派大星' },
        { employeeId: 'i', name: '海绵宝宝' },
      ];
    },
  },
] as MockMethod[];