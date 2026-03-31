import { DeleteOutlined, HistoryOutlined, PlusOutlined, PlayCircleOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Checkbox,
  Col,
  Descriptions,
  Drawer,
  Form,
  Input,
  Row,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { AccountFormModal } from '@/components/AccountFormModal';
import { useAccountStore } from '@/store/accountStore';
import type { AccountRecord } from '@/services/api';

const { Title, Paragraph, Text } = Typography;

export default function AccountsPage() {
  const {
    accounts,
    logs,
    loading,
    submitting,
    favoriteRunning,
    lastRunResult,
    loadInitialData,
    saveAccount,
    removeAccount,
    executeFavorite,
  } = useAccountStore();
  const [selectedAccount, setSelectedAccount] = useState<AccountRecord | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [logDrawerOpen, setLogDrawerOpen] = useState(false);
  const [favoriteForm] = Form.useForm();

  useEffect(() => {
    loadInitialData().catch((error) => {
      const content = error instanceof Error ? error.message : '加载数据失败';
      message.error(content);
    });
  }, [loadInitialData]);

  useEffect(() => {
    const selected = favoriteForm.getFieldValue('accountIds');
    if (!selected?.length) {
      const defaultIds = accounts.filter((item) => item.isDefault).map((item) => item.id);
      if (defaultIds.length) {
        favoriteForm.setFieldsValue({ accountIds: defaultIds });
      }
    }
  }, [accounts, favoriteForm]);

  const selectedRowKeys = Form.useWatch('accountIds', favoriteForm) as number[] | undefined;

  const columns = useMemo(
    () => [
      {
        title: '账号名称',
        dataIndex: 'name',
        key: 'name',
        render: (value: string, record: AccountRecord) => (
          <Space>
            <span>{value}</span>
            {record.isDefault ? <Tag color="blue">默认</Tag> : null}
          </Space>
        ),
      },
      {
        title: '登录账号',
        dataIndex: 'usernamePreview',
        key: 'usernamePreview',
      },
      {
        title: '备注',
        dataIndex: 'remark',
        key: 'remark',
        render: (value?: string) => value || '-',
      },
      {
        title: '更新时间',
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        render: (value: string) => new Date(value).toLocaleString(),
      },
      {
        title: '操作',
        key: 'actions',
        render: (_: unknown, record: AccountRecord) => (
          <Space>
            <Button
              type="link"
              onClick={() => {
                setSelectedAccount(record);
                setModalOpen(true);
              }}
            >
              编辑
            </Button>
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={async () => {
                try {
                  await removeAccount(record.id);
                  message.success('账号已删除');
                } catch (error) {
                  message.error(error instanceof Error ? error.message : '删除失败');
                }
              }}
            >
              删除
            </Button>
          </Space>
        ),
      },
    ],
    [message, removeAccount],
  );

  return (
    <div style={{ padding: 24 }}>
        <Row gutter={[24, 24]}>
          <Col xs={24}>
            <Card
              bordered={false}
              style={{ background: 'var(--card-bg)', boxShadow: 'var(--card-shadow)', borderRadius: 24 }}
            >
              <Title level={2} style={{ marginTop: 0 }}>
                收藏任务控制台
              </Title>
              <Paragraph style={{ maxWidth: 720, marginBottom: 0 }}>
                统一管理加密账号、查看最近执行日志，并直接输入商品链接调用后端自动收藏任务。
              </Paragraph>
            </Card>
          </Col>

          <Col xs={24} lg={16}>
            <Card
              title="账号管理"
              extra={
                <Space>
                  <Button icon={<HistoryOutlined />} onClick={() => setLogDrawerOpen(true)}>
                    查看日志
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setSelectedAccount(undefined);
                      setModalOpen(true);
                    }}
                  >
                    新增账号
                  </Button>
                </Space>
              }
              bordered={false}
              style={{ background: 'var(--card-bg)', boxShadow: 'var(--card-shadow)', borderRadius: 24 }}
            >
              <Table rowKey="id" loading={loading} columns={columns} dataSource={accounts} pagination={false} />
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card
              title="执行收藏"
              bordered={false}
              style={{ background: 'var(--card-bg)', boxShadow: 'var(--card-shadow)', borderRadius: 24 }}
            >
              <Form
                form={favoriteForm}
                layout="vertical"
                initialValues={{ accountIds: accounts.filter((item) => item.isDefault).map((item) => item.id) }}
                onFinish={async (values) => {
                  try {
                    await executeFavorite(values);
                    message.success('收藏任务已提交');
                  } catch (error) {
                    message.error(error instanceof Error ? error.message : '收藏任务执行失败');
                  }
                }}
              >
                <Form.Item
                  name="url"
                  label="收藏链接"
                  rules={[{ required: true, message: '请输入需要收藏的 url' }]}
                >
                  <Input placeholder="https://stzb.cbg.163.com/..." />
                </Form.Item>
                <Form.Item name="accountIds" label="执行账号">
                  <Checkbox.Group
                    options={accounts.map((item) => ({
                      label: item.name,
                      value: item.id,
                    }))}
                  />
                </Form.Item>
                <Form.Item name="headless" valuePropName="checked">
                  <Checkbox>无头模式运行</Checkbox>
                </Form.Item>
                <Button type="primary" htmlType="submit" block loading={favoriteRunning} icon={<PlayCircleOutlined />}>
                  立即执行
                </Button>
              </Form>

              <Descriptions size="small" column={1} style={{ marginTop: 24 }}>
                <Descriptions.Item label="当前选中">
                  {selectedRowKeys?.length ? `${selectedRowKeys.length} 个账号` : '未指定时将按后端传入列表执行'}
                </Descriptions.Item>
                <Descriptions.Item label="最近结果">
                  <Text style={{ whiteSpace: 'pre-wrap' }}>{lastRunResult || '暂无执行结果'}</Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>

        <AccountFormModal
          open={modalOpen}
          loading={submitting}
          initialValues={selectedAccount}
          onCancel={() => {
            setModalOpen(false);
            setSelectedAccount(undefined);
          }}
          onSubmit={async (values) => {
            try {
              await saveAccount(values, selectedAccount?.id);
              message.success(selectedAccount ? '账号已更新' : '账号已创建');
            } catch (error) {
              message.error(error instanceof Error ? error.message : '保存账号失败');
              throw error;
            }
          }}
        />

        <Drawer
          title="操作日志"
          width={640}
          open={logDrawerOpen}
          onClose={() => setLogDrawerOpen(false)}
          extra={<Tag color="geekblue">{logs.length} 条</Tag>}
        >
          <Space direction="vertical" size={16} style={{ display: 'flex' }}>
            {logs.map((log) => (
              <Card
                key={log.id}
                size="small"
                style={{
                  borderRadius: 18,
                  borderColor: log.success ? '#b7eb8f' : '#ffccc7',
                }}
              >
                <Space direction="vertical" size={4} style={{ display: 'flex' }}>
                  <Space>
                    <Tag color={log.success ? 'success' : 'error'}>{log.success ? '成功' : '失败'}</Tag>
                    <Text strong>{log.action}</Text>
                  </Space>
                  <Text type="secondary">{new Date(log.createdAt).toLocaleString()}</Text>
                  <Text>{log.account?.name || '系统任务'}</Text>
                  {log.targetUrl ? <Text copyable>{log.targetUrl}</Text> : null}
                  <Paragraph style={{ marginBottom: 0 }}>{log.message || '无额外说明'}</Paragraph>
                </Space>
              </Card>
            ))}
          </Space>
        </Drawer>
      </div>
  );
}
