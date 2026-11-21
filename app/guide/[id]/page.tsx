import GuideApp from '@/components/guide-app';
import { notFound, redirect } from 'next/navigation';
import { delegateContact } from '@/lib/contact';

export default async function Page({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  if(id===delegateContact.id) redirect('/contact');
  if(id==='g-b6b7ba1125'||id==='g-2e018255-75c8-4e96-97a2-ae3ae4d3529f') redirect('/guide/g-1a5f10ad59');
  if(id==='g-f40ad3be20') notFound();
  return <GuideApp articleId={id}/>;
}
