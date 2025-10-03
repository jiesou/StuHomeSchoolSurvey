import { createApp } from 'vue'
import router from './router'
import App from './App.vue'
import {
  Button,
  Card,
  Checkbox,
  Col,
  ConfigProvider,
  Descriptions,
  Divider,
  Dropdown,
  Form,
  Input,
  InputNumber,
  Layout,
  Menu,
  Modal,
  PageHeader,
  Popconfirm,
  Rate,
  Result,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  message
} from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import './style.css'

const app = createApp(App)

// 注册使用的组件
app.use(Button)
app.use(Card)
app.use(Checkbox)
app.use(Col)
app.use(ConfigProvider)
app.use(Descriptions)
app.use(Divider)
app.use(Dropdown)
app.use(Form)
app.use(Input)
app.use(InputNumber)
app.use(Layout)
app.use(Menu)
app.use(Modal)
app.use(PageHeader)
app.use(Popconfirm)
app.use(Rate)
app.use(Result)
app.use(Row)
app.use(Select)
app.use(Space)
app.use(Spin)
app.use(Table)
app.use(Tag)

// 全局配置 message
app.config.globalProperties.$message = message

app.use(router)

app.mount('#app')
