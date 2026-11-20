import GuideApp from '@/components/guide-app';
import { redirect } from 'next/navigation';
import { delegateContact } from '@/lib/contact';

export default async function Page({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  if(id===delegateContact.id) redirect('/contact');
  return <GuideApp articleId={id}/>;
}
