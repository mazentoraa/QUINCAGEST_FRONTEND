import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, Card, Typography, Spin } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { Title } = Typography;

const LoginForm = ({ onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const success = await login(values.username, values.password);
            if (success && onSuccess) {
                onSuccess();
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="login-card" style={{ maxWidth: 400, margin: '0 auto' }}>
            <Title level={2} style={{ textAlign: 'center', marginBottom: 30 }}>Log In</Title>
            
            <Spin spinning={loading}>
                <Form
                    name="normal_login"
                    initialValues={{ remember: true }}
                    onFinish={onFinish}
                    size="large"
                >
                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: 'Please enter your username!' }]}
                    >
                        <Input 
                            prefix={<UserOutlined />} 
                            placeholder="Username" 
                        />
                    </Form.Item>
                    
                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Please enter your password!' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Password"
                        />
                    </Form.Item>
                    
                    <Form.Item>
                        <Form.Item name="remember" valuePropName="checked" noStyle>
                            <Checkbox>Remember me</Checkbox>
                        </Form.Item>
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
                            Log in
                        </Button>
                    </Form.Item>
                </Form>
            </Spin>
        </Card>
    );
};

export default LoginForm;
