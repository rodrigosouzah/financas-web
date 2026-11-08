import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata:Metadata={title:'VR Finanças — seu dinheiro com clareza',description:'Seu panorama financeiro: cartões, despesas, parcelas, contas, reembolsos e poupança.',manifest:'/manifest.webmanifest',icons:{icon:'/favicon.svg',apple:'/icons/icon-192.png'}};
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#FFFFFF'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>;}
