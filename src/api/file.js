import { saveAs } from 'file-saver'; // 确保已安装 file-saver
import service from './axios'; // 替换为你的请求实例

/**
 * 通用文件下载函数
 * @param {string} url - 接口地址
 * @param {object} params - 请求参数
 * @param {string} defaultFileName - 默认文件名（可选）
 */
async function downloadFile(url, params, defaultFileName = 'data.xlsx') {
    try {
        const response = await service.get(url, {
            params,
            responseType: 'blob', // 重要：指定响应类型为二进制文件
            timeout: 60000, // 超时时间设置为 60 秒
        });


        // 获取文件名（从响应头中提取）
        const contentDisposition = response.headers['content-disposition'];
        const fileName = contentDisposition
            ? contentDisposition.split('filename=')[1]
            : defaultFileName;

        // 保存文件
        saveAs(new Blob([response.data]), fileName);
    } catch (error) {
        console.error('文件下载失败', error);
        throw error; // 抛出错误，方便调用方处理
    }
}

export {downloadFile}