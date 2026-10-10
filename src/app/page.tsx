import Link from "next/link";

const STEPS = [
  {
    title: "Post a request",
    body: "Sign in with Kakao or Google, then tell us where and when you'd like a local to show you around.",
  },
  {
    title: "Chat with a volunteer",
    body: "Local volunteer guides browse open requests and message you in real time.",
  },
  {
    title: "Explore Seoul together",
    body: "Pick the guide you like, meet up, and enjoy the city like a local — for free.",
  },
];

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-16 sm:py-24">
      <section className="max-w-2xl">
        <p className="text-sm font-semibold text-rose-500">Free volunteer guides in Seoul</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          See Seoul with a local friend.
        </h1>
        <p className="mt-5 text-lg text-zinc-600">
          SeOUL MATE connects travelers with Korean volunteers who love showing visitors around
          their city. 서울을 찾은 외국인 여행객에게 자원봉사 가이드를 연결해 드려요.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/requests/new"
            className="rounded-xl bg-rose-500 px-5 py-3 font-medium text-white hover:bg-rose-600"
          >
            I need a guide
          </Link>
          <Link
            href="/requests"
            className="rounded-xl border border-zinc-300 bg-white px-5 py-3 font-medium hover:bg-zinc-50"
          >
            I want to volunteer
          </Link>
        </div>
      </section>

      <section className="mt-20 grid gap-4 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <div key={step.title} className="rounded-2xl border border-zinc-200 bg-white p-6">
            <span className="text-sm font-semibold text-rose-500">0{i + 1}</span>
            <h2 className="mt-2 font-semibold">{step.title}</h2>
            <p className="mt-2 text-sm text-zinc-600">{step.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
