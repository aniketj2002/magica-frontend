export const TRANSLOADIT_ASSEMBLIES_URL =
  "https://api2.transloadit.com/assemblies";

export type UploadToTransloaditArgs = {
  file: File;
  params: string;
  signature: string;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
};

export type UploadToTransloaditResult = {
  assemblyId: string;
  assemblySslUrl: string;
};

type TransloaditAssemblyResponse = {
  assembly_id?: string;
  assembly_ssl_url?: string;
  error?: string;
  message?: string;
};

/**
 * Browser-direct multipart upload to Transloadit via XHR so upload progress
 * is available (fetch cannot report upload progress).
 */
export function uploadToTransloadit(
  args: UploadToTransloaditArgs,
): Promise<UploadToTransloaditResult> {
  const { file, params, signature, onProgress, signal } = args;

  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append("params", params);
    form.append("signature", signature);
    form.append("file", file, file.name);

    const onAbort = () => {
      xhr.abort();
    };
    signal?.addEventListener("abort", onAbort, { once: true });

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return;
      const percent = Math.max(
        0,
        Math.min(100, Math.round((event.loaded / event.total) * 100)),
      );
      onProgress(percent);
    };

    xhr.onerror = () => {
      signal?.removeEventListener("abort", onAbort);
      reject(new Error("Transloadit upload network error"));
    };

    xhr.onabort = () => {
      signal?.removeEventListener("abort", onAbort);
      reject(new DOMException("Aborted", "AbortError"));
    };

    xhr.onload = () => {
      signal?.removeEventListener("abort", onAbort);
      let data: TransloaditAssemblyResponse = {};
      try {
        data = JSON.parse(xhr.responseText) as TransloaditAssemblyResponse;
      } catch {
        reject(new Error("Transloadit returned invalid JSON"));
        return;
      }

      if (xhr.status < 200 || xhr.status >= 300 || data.error) {
        reject(
          new Error(
            data.message ||
              data.error ||
              `Transloadit upload failed (${xhr.status})`,
          ),
        );
        return;
      }

      if (!data.assembly_id || !data.assembly_ssl_url) {
        reject(new Error("Transloadit response missing assembly fields"));
        return;
      }

      onProgress?.(100);
      resolve({
        assemblyId: data.assembly_id,
        assemblySslUrl: data.assembly_ssl_url,
      });
    };

    xhr.open("POST", TRANSLOADIT_ASSEMBLIES_URL);
    xhr.send(form);
  });
}
