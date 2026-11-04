import { Metadata } from 'next';
import { TemplateHubView } from '@/components/template-builder/TemplateHubView';

export const metadata: Metadata = {
  title: 'Thư Viện Template Bài Báo Khoa Học | StructPaper',
  description:
    'Quản lý và bắt đầu tạo mới Template bài báo khoa học chuẩn VNUHCM, IEEE, Nature, Elsevier.',
};

export default function TemplatesPage() {
  return <TemplateHubView />;
}
