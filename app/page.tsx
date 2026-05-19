import Link from "next/link";
import { Button } from "@/components/ui/button";

const MARCAS = ["Apogeu", "Matriz Educação", "QI Bilíngue", "União", "Unificado", "Americano"];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-24">
      <div className="text-center space-y-4 max-w-2xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
          Raiz Educação
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Olimpíadas do Conhecimento
        </h1>
        <p className="text-lg text-muted-foreground">
          Plataforma centralizada de gestão de olimpíadas para as 6 marcas do grupo Raiz Educação.
          Inscrições, calendário, resultados e indicadores em um só lugar.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/login">
          <Button size="lg">Acessar plataforma</Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="outline" size="lg">
            Ver dashboard
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8 text-center text-sm text-muted-foreground">
        {MARCAS.map((marca) => (
          <div
            key={marca}
            className="rounded-lg border bg-card px-4 py-3 font-medium text-card-foreground"
          >
            {marca}
          </div>
        ))}
      </div>
    </main>
  );
}
