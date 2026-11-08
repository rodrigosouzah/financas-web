import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Finanças — seu dinheiro com clareza',description:'Seu panorama financeiro: cartões, despesas, parcelas, contas, reembolsos e poupança.',manifest:'/manifest.webmanifest',icons:{icon:'/icons/icon-192.png',apple:'/icons/icon-192.png'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>;}
