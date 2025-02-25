// http.js
import axios from 'axios'

const http = axios.create({
    baseURL: 'http://localhost:8000',  // 修改为实际的后端地址
    timeout: 5000
})

// 请求拦截器
http.interceptors.request.use(
    config => {
        const token = localStorage.getItem('authToken')
        if (token) {
            config.headers['Authorization'] = 'Bearer ' + token
        }
        return config
    },
    error => {
        return Promise.reject(error)
    }
)

const screenWidth = window.innerWidth;
// 响应拦截器（可选）
http.interceptors.response.use(
    (response) => {
        if (response.data instanceof Blob) {
            return response; // 直接返回 Blob 对象
        } else {
            return response.data; // 直接返回响应数据
        }
    },
    (error) => {
        if (error.response.status === 403) {
            // 处理 403 错误（如跳转到登录页）
            console.error('无权限访问，请重新登录');
            localStorage.removeItem('authToken'); // 清除 token


            if (screenWidth < 768) {
                // 手机端（屏幕宽度小于 768px）
                window.location.href = '/phone.html#/mobileLogin'; // 跳转到手机端登录页
            } else {
                // Web 端（屏幕宽度大于等于 768px）
                window.location.href = '/web.html#/login'; // 跳转到 Web 端登录页
            }

        }
        return Promise.reject(error);
    }
);




export default http