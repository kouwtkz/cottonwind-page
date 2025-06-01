import type { Route } from "./+types/test";

export function meta({data}: Route.MetaArgs) {
  return [
    { title: "めぇ" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return <main>めぇめぇ</main>;
}
