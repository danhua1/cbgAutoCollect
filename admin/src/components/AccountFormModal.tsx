import { Modal, Form, Input, Switch } from 'antd';
import { useEffect } from 'react';
import type { AccountRecord } from '@/services/api';

type Props = {
  open: boolean;
  loading: boolean;
  initialValues?: AccountRecord;
  onCancel: () => void;
  onSubmit: (values: {
    name: string;
    username: string;
    password?: string;
    remark?: string;
    isDefault?: boolean;
  }) => Promise<void>;
};

export function AccountFormModal({ open, loading, initialValues, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (!open) {
      form.resetFields();
      return;
    }

    form.setFieldsValue({
      name: initialValues?.name,
      username: initialValues?.usernamePreview,
      password: '',
      remark: initialValues?.remark,
      isDefault: initialValues?.isDefault,
    });
  }, [form, initialValues, open]);

  return (
    <Modal
      open={open}
      title={initialValues ? '编辑账号' : '新增账号'}
      onCancel={onCancel}
      confirmLoading={loading}
      onOk={async () => {
        const values = await form.validateFields();
        await onSubmit(values);
        onCancel();
      }}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item name="name" label="账号名称" rules={[{ required: true, message: '请输入账号名称' }]}>
          <Input placeholder="例如：账号A" />
        </Form.Item>
        <Form.Item name="username" label="登录账号" rules={[{ required: true, message: '请输入登录账号' }]}>
          <Input placeholder="邮箱或用户名" />
        </Form.Item>
        <Form.Item
          name="password"
          label="登录密码"
          rules={[
            { required: !initialValues, message: '请输入登录密码' },
          ]}
          extra={initialValues ? '留空表示保持原密码不变。' : undefined}
        >
          <Input.Password placeholder="请输入密码" />
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={3} placeholder="记录账号用途或说明" />
        </Form.Item>
        <Form.Item name="isDefault" label="默认账号" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}
