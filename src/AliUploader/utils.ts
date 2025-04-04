import OSS from 'ali-oss';
import { message } from 'antd';
import { FileData, Props } from './index';

// 文件类型判断
export function getFileType(fileName: string): FileData['type'] {
  if (/\.(png|jpg|jpeg|gif)$/i.test(fileName)) return 'image';
  if (/\.(doc|docx|pdf|xls|xlsx|pptx)$/i.test(fileName)) return 'document';
  return 'other';
}


// OSS 上传
export async function uploadToOSS(
  file: File,
  ossConfig: Props['ossConfig'],
  onProgress: (result: any) => void,
): Promise<any> {
  if (!ossConfig) throw new Error('OSS 配置未提供');
  if (Object.values(ossConfig).some((v) => !v)){
     message.error('OSS 配置不完整');
      return;
    }

  const client = new OSS({
    region: ossConfig.region,
    accessKeyId: ossConfig.accessKeyId,
    accessKeySecret: ossConfig.accessKeySecret,
    bucket: ossConfig.bucket,
  });

  const fileName = `${Date.now()}-${file.name}`;
  const result = await client.put(fileName, file);
  if (result.res.status !== 200) throw new Error('OSS 上传失败');
  onProgress({
    percent: 100,
    uid: `${Date.now()}-${Math.random()}`,
    fileId: fileName,
    name: result.name,
    url: result.url, // OSS 云端链接
    status: 'done',
    cloudUrl: result.url, // OSS 云端链接
    type: getFileType(file.name),
    uploadTime: Date.now(),
  });
  return {
    thumbUrl: result.url, // OSS 云端链接
    uid: `${Date.now()}-${Math.random()}`,
    fileId: fileName,
    name: result.name,
    url: result.url, // OSS 云端链接
    status: 'done',
    type: getFileType(file.name),
    uploadTime: Date.now(),
  };
}

// 删除OSS文件
export async function delfileFromOSS(
  name: string,
  ossConfig: Props['ossConfig'],
  callback: (result: any) => void,
): Promise<any> {
  if (!ossConfig) throw new Error('OSS 配置未提供');
  if (Object.values(ossConfig).some((v) => !v)){
    message.error('OSS 配置不完整');
    return;
  }
  const client = new OSS({
    region: ossConfig.region,
    accessKeyId: ossConfig.accessKeyId,
    accessKeySecret: ossConfig.accessKeySecret,
    bucket: ossConfig.bucket,
  });

  const result = await client.delete(name);
  if (result.res.status !== 204) throw new Error('OSS 删除失败');
  message.success(`(${name})-oss文件删除成功`);
  callback(result);
}

// 获取OSS文件列表
export async function getOSSList(
  ossConfig: Props['ossConfig'],
  callback: (result: any) => void,
): Promise<any> {
  if (!ossConfig) throw new Error('OSS 配置未提供');
  if (Object.values(ossConfig).some((v) => !v)) {
    message.error('OSS 配置不完整');
    return;
  }
  const client = new OSS({
    region: ossConfig.region,
    accessKeyId: ossConfig.accessKeyId,
    accessKeySecret: ossConfig.accessKeySecret,
    bucket: ossConfig.bucket,
  });
// @ts-ignore
  const result = await client.list();
  if (result.res.status !== 200) throw new Error('OSS 上传失败');
  callback(result);
}

// 文件校验
export function validateFile(
  file: File,
  accept: string,
  maxBytes: number,
): boolean {
  const types = accept.split(',').map((t) => t.trim());
  const isValidType = types.some((t) => file.name.endsWith(t));
  const isValidSize = file.size / 1024 / 1024 < maxBytes;

  if (!isValidType) message.warning('上传文件格式不支持');
  if (!isValidSize) message.warning(`文件大小不能超过${maxBytes}MB`);
  return isValidType && isValidSize;
}
