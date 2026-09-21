import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Prova IA — Simulados inteligentes para concursos";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background:
            "linear-gradient(135deg, #020617 0%, #0f172a 55%, #1e1b4b 100%)",
          color: "white",
          fontFamily: "Arial, sans-serif",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 520,
            height: 520,
            borderRadius: "9999px",
            background: "rgba(124,58,237,.28)",
            filter: "blur(60px)",
            top: -170,
            right: -120,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 360,
            height: 360,
            borderRadius: "9999px",
            background: "rgba(217,70,239,.16)",
            filter: "blur(60px)",
            left: -120,
            bottom: -130,
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            padding: "72px 82px",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                fontSize: 26,
                fontWeight: 800,
                letterSpacing: 5,
                color: "#c4b5fd",
              }}
            >
              PROVA IA
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 64,
                lineHeight: 1.06,
                fontWeight: 900,
                maxWidth: 900,
              }}
            >
              Estude com foco no edital que realmente importa.
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 30,
                lineHeight: 1.35,
                color: "#cbd5e1",
                maxWidth: 900,
              }}
            >
              Simulados personalizados, análise de edital e evolução por assunto.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 18,
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                padding: "16px 24px",
                borderRadius: 18,
                background: "#7c3aed",
                fontSize: 24,
                fontWeight: 800,
              }}
            >
              Prepare-se com estratégia
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 23,
                color: "#94a3b8",
              }}
            >
              prova-ia-six.vercel.app
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
