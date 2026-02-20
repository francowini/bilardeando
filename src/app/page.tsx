export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header bar */}
      <div className="header-bar text-lg px-4 py-3">
        BILARDEANDO — Fantasy Football Argentina
      </div>

      {/* Content */}
      <main className="max-w-5xl mx-auto p-6">
        <div className="card-retro">
          <div className="card-retro-header">
            Bienvenido
          </div>
          <div className="card-retro-body space-y-4">
            <p className="text-lg font-body">
              Armá tu equipo de fantasía con jugadores de la Liga Profesional Argentina.
              Competí con amigos, ganá puntos y demostrá que sabés de fútbol.
            </p>

            <div className="flex gap-3">
              <button className="btn-retro-primary">
                Ingresar con Google
              </button>
              <button className="btn-retro-accent">
                Ver Demo
              </button>
            </div>
          </div>
        </div>

        {/* Sample data table */}
        <div className="card-retro mt-6">
          <div className="card-retro-header">
            Top Jugadores
          </div>
          <div className="card-retro-body p-0">
            <table className="table-retro">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Jugador</th>
                  <th>Pos</th>
                  <th>Equipo</th>
                  <th>Rating</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td className="font-bold">Lionel Messi</td>
                  <td><span className="badge-fwd">FWD</span></td>
                  <td>Inter Miami</td>
                  <td>9.2</td>
                  <td>$15M</td>
                </tr>
                <tr>
                  <td>2</td>
                  <td className="font-bold">Enzo Fernández</td>
                  <td><span className="badge-mid">MID</span></td>
                  <td>Chelsea</td>
                  <td>8.5</td>
                  <td>$12M</td>
                </tr>
                <tr>
                  <td>3</td>
                  <td className="font-bold">Dibu Martínez</td>
                  <td><span className="badge-gk">GK</span></td>
                  <td>Aston Villa</td>
                  <td>8.3</td>
                  <td>$10M</td>
                </tr>
                <tr>
                  <td>4</td>
                  <td className="font-bold">Cuti Romero</td>
                  <td><span className="badge-def">DEF</span></td>
                  <td>Tottenham</td>
                  <td>8.1</td>
                  <td>$11M</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
