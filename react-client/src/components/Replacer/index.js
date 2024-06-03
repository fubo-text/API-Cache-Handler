import { Input, Switch, Form } from "antd";
import { sendMessage } from "../../utils";

const Replacer = () => {
  const onFormLayoutChange = (names, values) => {
    console.log(names, values);
    const message = {
      type: "ajaxInterceptor",
      query: "setData",
      ...values,
    };
    sendMessage(message);
  };
  return (
    <Form layout="vertical" onValuesChange={onFormLayoutChange}>
      <Form.Item label="是否开启代理" name="checked">
        <Switch />
      </Form.Item>
      <Form.Item label="代理域名（不填默认代理所有的域名）" name="value">
        <Input placeholder="请输入域名" />
      </Form.Item>
    </Form>
  );
};

export default Replacer;
