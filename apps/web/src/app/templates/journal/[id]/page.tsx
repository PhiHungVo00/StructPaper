import JournalDetailClient from './journal-detail-client';

export function generateStaticParams() {
  return [
    { id: 'new' },
    { id: 'std' },
    { id: 'vnuhcm-natsci' },
    { id: 'vnuhcm-tech' },
    { id: 'vnuhcm-socsci' },
    { id: 'vnuhcm-econ' },
    { id: 'vnuhcm-med' },
    { id: 'vnuhcm-earth' },
  ];
}

export default function JournalDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <JournalDetailClient id={params.id} />;
}
