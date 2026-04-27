import React, { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Image as PrimeImage } from 'primereact/image';

interface AppCameraInputProps {
  onPhotoTaken: (file: File | null) => void;
  loading?: boolean;
}

export const AppCameraInput = ({ 
  onPhotoTaken,
  loading = false, 
}: AppCameraInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();

      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, []);

  const isMobile = () => {
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
      navigator.userAgent
    );
  };

  const startCamera = async () => {
    const secure = window.isSecureContext && navigator.mediaDevices;

    if (!secure) {
      cameraInputRef.current?.click();
      return;
    }

    // Mobile usa câmera nativa
    if (isMobile()) {
      cameraInputRef.current?.click();
      return;
    }

    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(media);
      setCameraOpen(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = media;
          videoRef.current.play();
        }
      }, 100);
    } catch (error) {
      cameraInputRef.current?.click();
    }
  };

  const capturePhoto = async () => {
    const video = videoRef.current;

    if (!video) return;

    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) return;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      async (blob) => {
        if (!blob) return;

        const file = new File([blob], `camera_${Date.now()}.jpg`, {
          type: "image/jpeg",
        });

        const compressed = await compressImage(file);

        onPhotoTaken(compressed);

        if (preview) URL.revokeObjectURL(preview);

        const url = URL.createObjectURL(compressed);
        setPreview(url);

        stopCamera();
      },
      "image/jpeg",
      0.9
    );
  };

  const stopCamera = () => {
    const activeStream =
      stream || (videoRef.current?.srcObject as MediaStream | null);

    activeStream?.getTracks().forEach((track) => track.stop());

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setStream(null);
    setCameraOpen(false);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const compressedFile = await compressImage(file);
      onPhotoTaken(compressedFile)
      if (preview) {
        URL.revokeObjectURL(preview); // Limpa preview anterior
      }
      const url = URL.createObjectURL(compressedFile);
      setPreview(url);
    }
  };

  const limparSelecao = () => {
    if (preview) URL.revokeObjectURL(preview);

    setPreview(null);
    onPhotoTaken(null);

    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                
                // Configuração de Redimensionamento (Opcional)
                // Se a imagem for gigantesca (ex: 4000px), limitamos a 1920px para poupar memória
                let width = img.width;
                let height = img.height;
                const MAX_WIDTH = 1920;
                const MAX_HEIGHT = 1080;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                // Qualidade: 0.7 (70%) é o "sweet spot" para OCR: 
                // mantém nitidez e reduz o tamanho em até 80-90%
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            });
                            resolve(compressedFile);
                        } else {
                            reject(new Error("Erro ao gerar Blob da imagem"));
                        }
                    },
                    'image/jpeg',
                    0.7
                );
            };
        };
        reader.onerror = (err) => reject(err);
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Área de Preview */}
      <div className="relative border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden" 
        style={{ height: '250px', position: 'relative' }}>
        {preview ? (
          <div className="relative w-full h-full flex align-items-center justify-center p-2">

          <PrimeImage 
              src={preview} 
              alt="Preview da captura" 
              width="100%" 
              height="100%"
              preview // Esta prop habilita o clique para Full Screen
              imageClassName="w-full h-full object-contain" // Estilo da imagem interna
              style={{ maxHeight: '230px' }} // Limita a altura no modal de captura
          />
          {!loading && (
            <Button 
                type="button"
                icon="pi pi-trash" 
                className="p-button-rounded bg-red-600 text-white shadow-3"
                style={{ 
                    position: 'absolute', 
                    top: '15px', 
                    right: '15px', 
                    zIndex: 10, // Garante que fique acima da imagem
                    width: '30px', // Tamanho maior para facilitar o toque no celular
                    height: '30px'
                }}
                onClick={limparSelecao}
                tooltip="Remover imagem"
                tooltipOptions={{ position: 'left' }}
            />
          )}
          </div>
        ) : cameraOpen ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center text-gray-400">
            <i className="pi pi-camera text-4xl mb-2"></i>
            <p className="text-sm">Nenhuma imagem selecionada</p>
          </div>
        )}
        {loading && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <i className="pi pi-spin pi-spinner text-3xl text-blue-600"></i>
          </div>
        )}
      </div>

      {/* Ações */}
      <div className="grid grid-cols-2 gap-2">
        {!cameraOpen ? (
          <Button 
            label="Câmera" 
            icon="pi pi-camera" 
            onClick={startCamera} 
            className="p-button-outlined bg-blue-600 border-none shadow-md h-11 px-6 justify-center text-white"
          />
        ) : (
          <Button
            label="Capturar"
            icon="pi pi-check"
            onClick={capturePhoto}
            className="p-button-outlined bg-green-600 border-none shadow-md h-11 px-6 justify-center text-white"
          />
        )}

        {cameraOpen ? (
          <Button
            label="Cancelar câmera"
            icon="pi pi-times"
            onClick={stopCamera}
            className="p-button-danger"
          />
        ) : (
          <Button 
            label="Arquivo" 
            icon="pi pi-upload" 
            onClick={() => fileInputRef.current?.click()} 
            className="p-button-outlined p-button-text shadow-md border-none p-2"
          />    
        )}
      </div>

      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
      <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleFileChange} />
    </div>
  );
};