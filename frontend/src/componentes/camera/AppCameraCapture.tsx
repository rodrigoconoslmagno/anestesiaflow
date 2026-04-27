import React, { useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Image as PrimeImage } from 'primereact/image';

interface AppCameraInputProps {
  onPhotoTaken: (file: File | null) => void;
  loading?: boolean;
}

export const AppCameraInput = ({ 
  onPhotoTaken,
  loading, 
}: AppCameraInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  // const [isDesktopCameraActive, setIsDesktopCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  // const [currentFile, setCurrentFile] = useState<File | null>(null);

  const startCamera = async () => {
    const isSecureContext = window.isSecureContext && navigator.mediaDevices;
  
    if (!isSecureContext || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
      cameraInputRef.current?.click();
      return;
    }
  
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
  
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        capturePhoto();
      }
  
    } catch (err) {
      cameraInputRef.current?.click();
    }
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
  
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);
  
    canvas.toBlob(async (blob) => {
      if (!blob) return;
  
      const file = new File(
        [blob],
        `camera_${Date.now()}.jpg`,
        { type: 'image/jpeg' }
      );
  
      const compressedFile = await compressImage(file);
  
      onPhotoTaken(compressedFile);
  
      const url = URL.createObjectURL(compressedFile);
      setPreview(url);
  
      stopCamera();
  
    }, 'image/jpeg', 0.9);
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const compressedFile = await compressImage(file);
      onPhotoTaken(compressedFile)
      // setCurrentFile(compressedFile); // Guardamos o arquivo real
      if (preview) {
        URL.revokeObjectURL(preview); // Limpa preview anterior
      }
      const url = URL.createObjectURL(compressedFile);
      setPreview(url);
    }
  };

  const limparSelecao = () => {
    setPreview(null);
    onPhotoTaken(null);
    //setCurrentFile(null);
    // Limpa os inputs para permitir selecionar o mesmo arquivo novamente se necessário
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
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
        <Button 
          label="Câmera" 
          icon="pi pi-camera" 
          onClick={startCamera} 
          className="p-button-outlined bg-blue-600 border-none shadow-md h-11 px-6 justify-center text-white"
        />
        <Button 
          label="Arquivo" 
          icon="pi pi-upload" 
          onClick={() => fileInputRef.current?.click()} 
          className="p-button-outlined bg-blue-600 border-none shadow-md h-11 px-6 justify-center text-white "
        />
      </div>

      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
      <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleFileChange} />
    </div>

    // <div className={getColSpanClass(colSpan)}>
    //   {/* CONTAINER MESTRE: Força a pilha vertical (Label -> Preview -> Botões) */}
    //   <div className="w-full gap-2 p-3 border-round max-w-[100%] sm:max-w-[50%] ml-0 sm:ml-[25%] border-1 border-300 bg-white">
    //     {/* 1. LABEL (Sempre no topo e ocupando a largura toda) */}
    //     <div className="w-full flex align-items-center gap-2 mb-1">
    //       <i className="pi pi-camera text-blue-600 font-bold"></i>
    //       <span className="text-700 font-bold text-xs uppercase tracking-wider">
    //         {label}
    //       </span>
    //     </div>

    //     {/* 2. ÁREA DE VISUALIZAÇÃO (Ocupa 100% da largura do container) */}
    //     <div className="w-full border-2 border-dashed border-200 border-round-lg bg-gray-50 flex align-items-center justify-content-center overflow-hidden relative" 
    //          style={{ minHeight: '120px' }}>
          
    //       {isDesktopCameraActive ? (
    //         <div className="flex flex-column align-items-center w-full h-full p-2">
    //           <video ref={videoRef} autoPlay playsInline className="w-full border-round shadow-2" style={{ maxHeight: '250px' }} />
    //           <div className="flex gap-2 mt-2 absolute bottom-0 mb-4">
    //             <Button icon="pi pi-camera" className="p-button-rounded p-button-success shadow-3" onClick={capturePhoto} />
    //             <Button icon="pi pi-times" className="p-button-rounded p-button-danger shadow-3" onClick={stopCamera} />
    //           </div>
    //         </div>
    //       ) : preview ? (
    //         <div className="relative h-full w-full max-h-[180px] flex align-items-center justify-content-center p-2">
    //           <Image src={preview} alt="Preview" height="180" preview imageClassName="border-round shadow-2" />
    //           <Button 
    //             type="button" icon="pi pi-trash" className="p-button-rounded p-button-danger p-button-sm absolute"
    //             style={{ top: '10px', right: '10px' }}
    //             onClick={() => setPreview(null)}
    //           />
    //         </div>
    //       ) : (
    //         <div className="flex flex-column align-items-center text-400 gap-2">
    //           <i className="pi pi-image text-5xl"></i>
    //           <span className="text-xs font-bold uppercase">Aguardando Captura</span>
    //         </div>
    //       )}

    //       {loading && (
    //         <div className="absolute inset-0 flex align-items-center justify-center bg-white-alpha-60">
    //           <i className="pi pi-spin pi-spinner text-3xl text-blue-600"></i>
    //         </div>
    //       )}
    //     </div>

    //     {/* 3. LINHA DE BOTÕES (Lado a lado, mas a linha em si ocupa 100%) */}
    //     <div className="flex flex-row gap-2 w-full mt-1">
    //       <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
    //       <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleFileChange} />

    //       <Button 
    //         type="button"
    //         label="Câmera"
    //         icon="pi pi-camera"
    //         className="p-button-outlined p-button-secondary font-bold flex-1 p-3 bg-blue-600 text-white"
    //         onClick={startCamera}
    //         disabled={loading}
    //       />

    //       <Button 
    //         type="button"
    //         label="Arquivo"
    //         icon="pi pi-upload"
    //         className="p-button-outlined p-button-secondary font-bold flex-1 p-3 bg-blue-600 text-white"
    //         onClick={() => fileInputRef.current?.click()}
    //         disabled={loading}
    //       />
    //     </div>

    //   </div>
    // </div>
  );
};