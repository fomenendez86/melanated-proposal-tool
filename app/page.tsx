import { redirect } from "next/navigation";

export default function Home() {
  redirect("/proposals/1/editor");
}
