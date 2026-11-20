import GuideApp from '@/components/guide-app';
import { notFound, redirect } from 'next/navigation';
import { delegateContact } from '@/lib/contact';

export default async function Page({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  if(id===delegateContact.id) redirect('/contact');
  if(id==='g-f40ad3be20') notFound();
  return <GuideApp articleId={id}/>;
}
