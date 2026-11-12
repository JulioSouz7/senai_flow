
import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Icon } from "../../components/icons/Icon";

export function Scanner() {
  const [roomCode, setRoomCode] = useState("");
  const [scanError, setScanError] = useState("");
  const [step, setStep] = useState<"scan" | "form" | "done">("scan");
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  useEffect(() => {
    if (step !== "scan") return;

    const scanner = new Html5Qrcode("qr-reader");
    let cancelled = false;

    async function startScanner() {
      try {
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
          },
          async (decodedText) => {
            if (cancelled) return;

            setRoomCode(decodedText);
            setScanError("");
            setStep("form");

            try {
              await scanner.stop();
            } catch {
              // O scanner pode já ter sido encerrado.
            }
          },
          () => {
            // Ignora erros temporários enquanto procura o QR Code.
          }
        );
      } catch {
        if (!cancelled) {
          setScanError(
            "Não foi possível acessar a câmera. Verifique a permissão do navegador."
          );
        }
      }
    }

    startScanner();

    return () => {
      cancelled = true;

      if (scanner.isScanning) {
        scanner.stop().catch(() => {});
      }
    };
  }, [step]);

  const file = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setPhotoFile(selectedFile);
    setPhoto(selectedFile?.name || "");
  };

  const submitReport = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (text.trim().length >= 30 && photoFile) {
      // A integração com a API para enviar o relatório será feita aqui.
      setStep("done");
    }
  };

  if (step === "done") {
    return (
      <div className="student-success">
        <span><Icon name="check" size={34} /></span>
        <small>CHAMADO #AV-2851</small>
        <h1>Relato enviado</h1>
        <p>
          O ativo foi marcado como “Em manutenção”. Sua turma não perderá
          pontos pelo relato correto.
        </p>
        <button
          className="primary-btn"
          onClick={() => {
            setRoomCode("");
            setText("");
            setPhoto("");
            setPhotoFile(null);
            setScanError("");
            setStep("scan");
          }}
        >
          Voltar ao início
        </button>
      </div>
    );
  }

  if (step === "scan") {
    return (
      <>
        <div className="module-heading">
          <span>AVARIAS</span>
          <h1>Escanear QR Code</h1>
          <p>Aponte a câmera para o código fixado na sala.</p>
        </div>

        <div className="scanner">
          <div id="qr-reader" />
        </div>

        {scanError && <p role="alert">{scanError}</p>}

        <button
          className="text-button"
          onClick={() => {
            setScanError("");
            setRoomCode("");
            setStep("form");
          }}
        >
          Selecionar sala manualmente
        </button>
      </>
    );
  }

  return (
    <>
      <div className="module-heading">
        <span>SALA IDENTIFICADA</span>
        <h1>{roomCode || "Selecione a sala"}</h1>
        <p>Descreva o problema e anexe uma evidência.</p>
      </div>

      <form className="damage-form" onSubmit={submitReport}>
        <label>
          Equipamento
          <select required>
            <option>Projetor Epson • NIF 238.441</option>
            <option>Notebook do docente</option>
            <option>Outro item</option>
          </select>
        </label>

        <label>
          Descrição técnica
          <textarea
            required
            minLength={30}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder="Descreva o defeito, quando começou e como afeta o uso..."
          />
          <small className={text.trim().length < 30 ? "invalid" : ""}>
            {text.trim().length}/30 caracteres mínimos
          </small>
        </label>

        <label className="upload">
          <input
            required
            type="file"
            accept="image/*"
            capture="environment"
            onChange={file}
          />
          <Icon name={photo ? "check" : "upload"} />
          <b>{photo || "Anexar foto obrigatória"}</b>
          <small>
            {photo
              ? "Evidência selecionada"
              : "Tire uma foto ou escolha uma imagem da galeria"}
          </small>
        </label>

        <button
          className="primary-btn full"
          type="submit"
          disabled={text.trim().length < 30 || !photoFile}
        >
          Enviar relatório de avaria
        </button>
      </form>
    </>
  );
}

export default Scanner;
