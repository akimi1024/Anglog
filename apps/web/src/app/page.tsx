import Link from "next/link";

export default function Home(){
  return (
    <main className="max-w-md mx-auto p-6 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Anglog</h1>
        <p className="text-sm text-gray-600 mt-1">釣果を記録して共有する</p>
      </div>
      <nav className="flex flex-col gap-3">
        <Link href="/catches" className="border rounded p-3 text-center">みんなの記録</Link>
        <Link href="/catches/me" className="border rounded p-3 text-center">自分の記録</Link>
        <Link href="/catches/new" className="border rounded p-3 text-center">+ 釣果を記録</Link>
      </nav>
    </main>
  )
}