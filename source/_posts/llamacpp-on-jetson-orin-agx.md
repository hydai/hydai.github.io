---
title: 在 NVIDIA Jetson Orin AGX 上編譯 llama.cpp 與部署 AI 應用
date: 2025-03-07 13:28:00
tags:
- NVIDIA
- Jetson
- Orin
- AGX
- JetPack
- CUDA
- GGUF
- llamacpp
- Linux
- LLM
categories:
- Note
---

{% asset_img img.jpg %}

## 簡介
由於工作的緣故，需要將 llama.cpp 作為 WASI-NN 的後端所使用，來讓 WebAssembly 能具備使用 AI 模型的能力，也因此需要在各種平台上編譯 llama.cpp 作為我們的相依性函式庫。
而 NVIDIA Jetson Orin AGX 64GB 的版本，作為提供相對大的 VRAM 與支援 CUDA 的平台，自然是我們花許多力氣在上面進行測試與最佳化的目標。
本文將詳細記錄如何在 NVIDIA Jetson Orin AGX (JetPack 6.2) 上成功編譯 llama.cpp、將大型語言模型轉換成 GGUF 格式、進行模型量化以及最終部署 AI 應用的完整流程。

<!-- more -->

## 升級至 JetPack 6.2
不論你使用的是 NVIDIA Jetson Orin AGX 或者 Jetson Orin Nano，都強烈建議你升級到 JetPack 6.2 以上的版本，以確保你能夠使用最新的 CUDA 與與解鎖後的效能，同時這個版本提供了 Ubuntu 22.04 與 CUDA 12.6 的環境，具備更好的支援性。
至於怎麼安裝，根據不同的型號，操作可能有所差異，請[參考 NVIDIA 官方文件](https://docs.nvidia.com/jetson/jetpack/install-setup/index.html)，以取得最新的安裝方式，這裡不再贅述。

## 編譯 llama.cpp

### 安裝相依性套件
若升級到 JetPack 6.2 以上，CUDA 12.6 的工具鏈已經預先安裝在系統中，不過還是需要安裝一些相依性套件，以確保編譯 llama.cpp 時不會遇到問題。

* `build-essential`: 安裝編譯工具鏈，如: GCC/G++
* `cmake`: 安裝 CMake 編譯工具，目前 llama.cpp 已經改為使用 CMake 進行編譯
* `git`: 安裝 Git 版本控制工具，用來下載 llama.cpp 的原始碼

```bash
sudo apt update # 更新套件清單
sudo apt upgrade -y # 升級所有已安裝的套件
sudo apt install -y build-essential cmake git # 安裝編譯工具鏈、CMake 與 Git
```

### 下載 llama.cpp

如果你以前下載過 llama.cpp 的 repo ，他的位置已經從 `https://github.com/ggerganov/llama.cpp.git` 轉移到 `https://github.com/ggml-org/llama.cpp.git` 囉，請記得更新你的連結。

```bash
git clone https://github.com/ggml-org/llama.cpp.git
cd llama.cpp
```

### 編譯 llama.cpp

```bash
cmake -B build -DGGML_CUDA=ON # 在 build 目錄下產生編譯檔案
cmake --build build --parallel # 平行編譯，榨乾該機器上的所有 CPU 資源
```

以我的 Jetson Orin AGX 為例，編譯 llama.cpp 大約需要 30 分鐘左右，視機器效能而定。

```bash
cmake --build build --parallel  9873.06s user 246.00s system 645% cpu 26:07.55 total
```

編譯完成後，在 `build/bin` 中會產生 llama.cpp 的所有可執行檔案。

#### 若發生 CUDA 相關的編譯錯誤

如下：
```bash
-- Found CUDAToolkit: /usr/local/cuda/include (found version "12.6.68")
-- CUDA Toolkit found
-- Using CUDA architectures: 50;61;70;75;80
CMake Error at /usr/share/cmake-3.22/Modules/CMakeDetermineCompilerId.cmake:726 (message):
  Compiling the CUDA compiler identification source file
  "CMakeCUDACompilerId.cu" failed.

  Compiler: CMAKE_CUDA_COMPILER-NOTFOUND

  Build flags:

  Id flags: -v



  The output was:

  No such file or directory

Call Stack (most recent call first):
  /usr/share/cmake-3.22/Modules/CMakeDetermineCompilerId.cmake:6 (CMAKE_DETERMINE_COMPILER_ID_BUILD)
  /usr/share/cmake-3.22/Modules/CMakeDetermineCompilerId.cmake:48 (__determine_compiler_id_test)
  /usr/share/cmake-3.22/Modules/CMakeDetermineCUDACompiler.cmake:298 (CMAKE_DETERMINE_COMPILER_ID)
  ggml/src/ggml-cuda/CMakeLists.txt:25 (enable_language)

-- Configuring incomplete, errors occurred!
```

這是因為 CUDA 12.6 的編譯器路徑不正確，需要手動設定 CUDA 編譯器路徑，請執行以下指令：

```bash
export PATH=/usr/local/cuda-12.6/bin${PATH:+:${PATH}}
export LD_LIBRARY_PATH=/usr/local/cuda-12.6/lib64\
                         ${LD_LIBRARY_PATH:+:${LD_LIBRARY_PATH}}
```

接著重新執行上述的編譯指令即可解決。

## 模型轉換為 GGUF 格式
多數的模型並不是以 GGUF 的格式進行發布的，因此在使用 llama.cpp 執行之前，需要先將模型轉換成 GGUF 格式才能夠正確載入。
當然在 Hugging Face 上已經有不少人轉換好的 GGUF 模型，如果你是下載那些已經轉換的檔案就可以跳過此步驟。

### 下載原始模型
此處以 [DeepSeek-R1-Distill-Llama-8B](https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Llama-8B) 為例，你可以換成任何你喜歡的模型。

#### 使用 huggingface-cli 下載
由於下載需要不少時間，建議使用 [huggingface-cli](https://huggingface.co/docs/huggingface_hub/en/guides/cli) 來下載模型。

```bash
huggingface-cli download deepseek-ai/DeepSeek-R1-Distill-Llama-8B --local-dir ds-r1-distill-llama-8b
# huggingface-cli download <org/repo> --local-dir <存放在本機端的路徑>
```

#### 安裝轉換模型用的相依性函式庫

```bash
# 在 llama.cpp 的根目錄下執行
pip install -e .
```

#### 轉換模型

```bash
python convert_hf_to_gguf.py --outfile ./ds-r1-distill-llama-8b ./ds-r1-distill-llama-8b
# python convert_hf_to_gguf.py --outfile <輸出檔案資料夾> <模型所在資料夾>
```

以下為執行的 log 僅供參考：

```bash
INFO:hf-to-gguf:Loading model: ds-r1-distill-llama-8b
INFO:gguf.gguf_writer:gguf: This GGUF file is for Little Endian only
INFO:hf-to-gguf:Exporting model...
INFO:hf-to-gguf:rope_freqs.weight,           torch.float32 --> F32, shape = {64}
INFO:hf-to-gguf:gguf: loading model weight map from 'model.safetensors.index.json'
INFO:hf-to-gguf:gguf: loading model part 'model-00001-of-000002.safetensors'
INFO:hf-to-gguf:token_embd.weight,           torch.bfloat16 --> F16, shape = {4096, 128256}
INFO:hf-to-gguf:blk.0.attn_norm.weight,      torch.bfloat16 --> F32, shape = {4096}
INFO:hf-to-gguf:blk.0.ffn_down.weight,       torch.bfloat16 --> F16, shape = {14336, 4096}
INFO:hf-to-gguf:blk.0.ffn_gate.weight,       torch.bfloat16 --> F16, shape = {4096, 14336}
INFO:hf-to-gguf:blk.0.ffn_up.weight,         torch.bfloat16 --> F16, shape = {4096, 14336}
INFO:hf-to-gguf:blk.0.ffn_norm.weight,       torch.bfloat16 --> F32, shape = {4096}
INFO:hf-to-gguf:blk.0.attn_k.weight,         torch.bfloat16 --> F16, shape = {4096, 1024}
INFO:hf-to-gguf:blk.0.attn_output.weight,    torch.bfloat16 --> F16, shape = {4096, 4096}
INFO:hf-to-gguf:blk.0.attn_q.weight,         torch.bfloat16 --> F16, shape = {4096, 4096}
INFO:hf-to-gguf:blk.0.attn_v.weight,         torch.bfloat16 --> F16, shape = {4096, 1024}
...中間省略...
INFO:hf-to-gguf:blk.31.attn_norm.weight,     torch.bfloat16 --> F32, shape = {4096}
INFO:hf-to-gguf:blk.31.ffn_down.weight,      torch.bfloat16 --> F16, shape = {14336, 4096}
INFO:hf-to-gguf:blk.31.ffn_gate.weight,      torch.bfloat16 --> F16, shape = {4096, 14336}
INFO:hf-to-gguf:blk.31.ffn_up.weight,        torch.bfloat16 --> F16, shape = {4096, 14336}
INFO:hf-to-gguf:blk.31.ffn_norm.weight,      torch.bfloat16 --> F32, shape = {4096}
INFO:hf-to-gguf:blk.31.attn_k.weight,        torch.bfloat16 --> F16, shape = {4096, 1024}
INFO:hf-to-gguf:blk.31.attn_output.weight,   torch.bfloat16 --> F16, shape = {4096, 4096}
INFO:hf-to-gguf:blk.31.attn_q.weight,        torch.bfloat16 --> F16, shape = {4096, 4096}
INFO:hf-to-gguf:blk.31.attn_v.weight,        torch.bfloat16 --> F16, shape = {4096, 1024}
INFO:hf-to-gguf:output_norm.weight,          torch.bfloat16 --> F32, shape = {4096}
INFO:hf-to-gguf:Set meta model
INFO:hf-to-gguf:Set model parameters
INFO:hf-to-gguf:gguf: context length = 131072
INFO:hf-to-gguf:gguf: embedding length = 4096
INFO:hf-to-gguf:gguf: feed forward length = 14336
INFO:hf-to-gguf:gguf: head count = 32
INFO:hf-to-gguf:gguf: key-value head count = 8
INFO:hf-to-gguf:gguf: rope theta = 500000.0
INFO:hf-to-gguf:gguf: rms norm epsilon = 1e-05
INFO:hf-to-gguf:gguf: file type = 1
INFO:hf-to-gguf:Set model tokenizer
INFO:gguf.vocab:Adding 280147 merge(s).
INFO:gguf.vocab:Setting special token type bos to 128000
INFO:gguf.vocab:Setting special token type eos to 128001
INFO:gguf.vocab:Setting special token type pad to 128001
INFO:gguf.vocab:Setting add_bos_token to True
INFO:gguf.vocab:Setting add_eos_token to False
INFO:gguf.vocab:Setting chat_template to {% if not add_generation_prompt is defined %}{% set add_generation_prompt = false %}{% endif %}{% set ns = namespace(is_first=false, is_tool=false, is_output_first=true, system_prompt='') %}{%- for message in messages %}{%- if message['role'] == 'system' %}{% set ns.system_prompt = message['content'] %}{%- endif %}{%- endfor %}{{bos_token}}{{ns.system_prompt}}{%- for message in messages %}{%- if message['role'] == 'user' %}{%- set ns.is_tool = false -%}{{'<｜User｜>' + message['content']}}{%- endif %}{%- if message['role'] == 'assistant' and message['content'] is none %}{%- set ns.is_tool = false -%}{%- for tool in message['tool_calls']%}{%- if not ns.is_first %}{{'<｜Assistant｜><｜tool▁calls▁begin｜><｜tool▁call▁begin｜>' + tool['type'] + '<｜tool▁sep｜>' + tool['function']['name'] + '\n' + '```json' + '\n' + tool['function']['arguments'] + '\n' + '```' + '<｜tool▁call▁end｜>'}}{%- set ns.is_first = true -%}{%- else %}{{'\n' + '<｜tool▁call▁begin｜>' + tool['type'] + '<｜tool▁sep｜>' + tool['function']['name'] + '\n' + '```json' + '\n' + tool['function']['arguments'] + '\n' + '```' + '<｜tool▁call▁end｜>'}}{{'<｜tool▁calls▁end｜><｜end▁of▁sentence｜>'}}{%- endif %}{%- endfor %}{%- endif %}{%- if message['role'] == 'assistant' and message['content'] is not none %}{%- if ns.is_tool %}{{'<｜tool▁outputs▁end｜>' + message['content'] + '<｜end▁of▁sentence｜>'}}{%- set ns.is_tool = false -%}{%- else %}{% set content = message['content'] %}{% if '</think>' in content %}{% set content = content.split('</think>')[-1] %}{% endif %}{{'<｜Assistant｜>' + content + '<｜end▁of▁sentence｜>'}}{%- endif %}{%- endif %}{%- if message['role'] == 'tool' %}{%- set ns.is_tool = true -%}{%- if ns.is_output_first %}{{'<｜tool▁outputs▁begin｜><｜tool▁output▁begin｜>' + message['content'] + '<｜tool▁output▁end｜>'}}{%- set ns.is_output_first = false %}{%- else %}{{'\n<｜tool▁output▁begin｜>' + message['content'] + '<｜tool▁output▁end｜>'}}{%- endif %}{%- endif %}{%- endfor -%}{% if ns.is_tool %}{{'<｜tool▁outputs▁end｜>'}}{% endif %}{% if add_generation_prompt and not ns.is_tool %}{{'<｜Assistant｜><think>\n'}}{% endif %}
INFO:hf-to-gguf:Set model quantization version
INFO:gguf.gguf_writer:Writing the following files:
INFO:gguf.gguf_writer:/disk/models/ds-r1-distill-llama-8b/ds-r1-distill-llama-8B-F16.gguf: n_tensors = 292, total_size = 16.1G
Writing: 100%|███████████████████████████████████████████████████████████████████████████████████| 16.1G/16.1G [01:14<00:00, 216Mbyte/s]
INFO:hf-to-gguf:Model successfully exported to /disk/models/ds-r1-distill-llama-8b/ds-r1-distill-llama-8B-F16.gguf
```

在轉換後我們可以初步看到模型的大小關係，基本上沒有太大的變化：

```
# 轉換前的模型大小 (8.1G + 6.9G = 15G)
8.1G model-00001-of-000002.safetensors
6.9G model-00002-of-000002.safetensors
# 轉換後的 F16 GGUF
15G ds-r1-distill-llama-8B-F16.gguf
```

## 模型量化
由於眾所周知的原因（大家都很窮），部署完整版(F16)的多數模型實在過於龐大，除了因為大小的緣故很難被放入消費級的硬體外，還容易因為硬體效能限制導致推理速度不理想。這時候我們就會需要透過量化，雖然降低精度，卻也能保證模型被縮小到可以較容易部署的大小，並能獲得更高的推理速度，達到更好的可用性。

```bash
# 在 llama.cpp 的根目錄下執行
./build/bin/llama-quantize ./ds-r1-distill-llama-8b/ds-r1-distill-llama-8B-F16.gguf ./ds-r1-distill-llama-8b/ds-r1-distill-llama-8B-Q4_0.gguf q4_0
# ./build/bin/llama-quantize <f16 gguf 檔案路徑> <量化後的 gguf 檔案路徑> <量化的方法>
```

僅供參考的 log:

```
main: build = 4845 (d6c95b07)
main: built with cc (Ubuntu 11.4.0-1ubuntu1~22.04) 11.4.0 for aarch64-linux-gnu
main: quantizing '/disk/models/ds-r1-distill-llama-8b/ds-r1-distill-llama-8B-F16.gguf' to '/disk/models/ds-r1-distill-llama-8b/ds-r1-distill-llama-8B-Q4_0.gguf' as Q4_0
llama_model_loader: loaded meta data with 29 key-value pairs and 292 tensors from /disk/models/ds-r1-distill-llama-8b/ds-r1-distill-llama-8B-F16.gguf (version GGUF V3 (latest))
llama_model_loader: Dumping metadata keys/values. Note: KV overrides do not apply in this output.
llama_model_loader: - kv   0:                       general.architecture str              = llama
llama_model_loader: - kv   1:                               general.type str              = model
llama_model_loader: - kv   2:                               general.name str              = Ds R1 Distill Llama 8b
llama_model_loader: - kv   3:                           general.basename str              = ds-r1-distill-llama
llama_model_loader: - kv   4:                         general.size_label str              = 8B
llama_model_loader: - kv   5:                            general.license str              = mit
llama_model_loader: - kv   6:                          llama.block_count u32              = 32
llama_model_loader: - kv   7:                       llama.context_length u32              = 131072
llama_model_loader: - kv   8:                     llama.embedding_length u32              = 4096
llama_model_loader: - kv   9:                  llama.feed_forward_length u32              = 14336
llama_model_loader: - kv  10:                 llama.attention.head_count u32              = 32
llama_model_loader: - kv  11:              llama.attention.head_count_kv u32              = 8
llama_model_loader: - kv  12:                       llama.rope.freq_base f32              = 500000.000000
llama_model_loader: - kv  13:     llama.attention.layer_norm_rms_epsilon f32              = 0.000010
llama_model_loader: - kv  14:                          general.file_type u32              = 1
llama_model_loader: - kv  15:                           llama.vocab_size u32              = 128256
llama_model_loader: - kv  16:                 llama.rope.dimension_count u32              = 128
llama_model_loader: - kv  17:                       tokenizer.ggml.model str              = gpt2
llama_model_loader: - kv  18:                         tokenizer.ggml.pre str              = llama-bpe
llama_model_loader: - kv  19:                      tokenizer.ggml.tokens arr[str,128256]  = ["!", "\"", "#", "$", "%", "&", "'", ...
llama_model_loader: - kv  20:                  tokenizer.ggml.token_type arr[i32,128256]  = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, ...
llama_model_loader: - kv  21:                      tokenizer.ggml.merges arr[str,280147]  = ["Ġ Ġ", "Ġ ĠĠĠ", "ĠĠ ĠĠ", "...
llama_model_loader: - kv  22:                tokenizer.ggml.bos_token_id u32              = 128000
llama_model_loader: - kv  23:                tokenizer.ggml.eos_token_id u32              = 128001
llama_model_loader: - kv  24:            tokenizer.ggml.padding_token_id u32              = 128001
llama_model_loader: - kv  25:               tokenizer.ggml.add_bos_token bool             = true
llama_model_loader: - kv  26:               tokenizer.ggml.add_eos_token bool             = false
llama_model_loader: - kv  27:                    tokenizer.chat_template str              = {% if not add_generation_prompt is de...
llama_model_loader: - kv  28:               general.quantization_version u32              = 2
llama_model_loader: - type  f32:   66 tensors
llama_model_loader: - type  f16:  226 tensors
ggml_cuda_init: GGML_CUDA_FORCE_MMQ:    no
ggml_cuda_init: GGML_CUDA_FORCE_CUBLAS: no
ggml_cuda_init: found 1 CUDA devices:
  Device 0: Orin, compute capability 8.7, VMM: yes
[   1/ 292]                        output.weight - [ 4096, 128256,     1,     1], type =    f16, converting to q6_K .. size =  1002.00 MiB ->   410.98 MiB
[   2/ 292]                   output_norm.weight - [ 4096,     1,     1,     1], type =    f32, size =    0.016 MB
[   3/ 292]                    rope_freqs.weight - [   64,     1,     1,     1], type =    f32, size =    0.000 MB
[   4/ 292]                    token_embd.weight - [ 4096, 128256,     1,     1], type =    f16, converting to q4_0 .. size =  1002.00 MiB ->   281.81 MiB
[   5/ 292]                  blk.0.attn_k.weight - [ 4096,  1024,     1,     1], type =    f16, converting to q4_0 .. size =     8.00 MiB ->     2.25 MiB
[   6/ 292]               blk.0.attn_norm.weight - [ 4096,     1,     1,     1], type =    f32, size =    0.016 MB
[   7/ 292]             blk.0.attn_output.weight - [ 4096,  4096,     1,     1], type =    f16, converting to q4_0 .. size =    32.00 MiB ->     9.00 MiB
[   8/ 292]                  blk.0.attn_q.weight - [ 4096,  4096,     1,     1], type =    f16, converting to q4_0 .. size =    32.00 MiB ->     9.00 MiB
[   9/ 292]                  blk.0.attn_v.weight - [ 4096,  1024,     1,     1], type =    f16, converting to q4_0 .. size =     8.00 MiB ->     2.25 MiB
[  10/ 292]                blk.0.ffn_down.weight - [14336,  4096,     1,     1], type =    f16, converting to q4_0 .. size =   112.00 MiB ->    31.50 MiB
[  11/ 292]                blk.0.ffn_gate.weight - [ 4096, 14336,     1,     1], type =    f16, converting to q4_0 .. size =   112.00 MiB ->    31.50 MiB
[  12/ 292]                blk.0.ffn_norm.weight - [ 4096,     1,     1,     1], type =    f32, size =    0.016 MB
[  13/ 292]                  blk.0.ffn_up.weight - [ 4096, 14336,     1,     1], type =    f16, converting to q4_0 .. size =   112.00 MiB ->    31.50 MiB
...中間省略...
[ 284/ 292]                 blk.31.attn_k.weight - [ 4096,  1024,     1,     1], type =    f16, converting to q4_0 .. size =     8.00 MiB ->     2.25 MiB
[ 285/ 292]              blk.31.attn_norm.weight - [ 4096,     1,     1,     1], type =    f32, size =    0.016 MB
[ 286/ 292]            blk.31.attn_output.weight - [ 4096,  4096,     1,     1], type =    f16, converting to q4_0 .. size =    32.00 MiB ->     9.00 MiB
[ 287/ 292]                 blk.31.attn_q.weight - [ 4096,  4096,     1,     1], type =    f16, converting to q4_0 .. size =    32.00 MiB ->     9.00 MiB
[ 288/ 292]                 blk.31.attn_v.weight - [ 4096,  1024,     1,     1], type =    f16, converting to q4_0 .. size =     8.00 MiB ->     2.25 MiB
[ 289/ 292]               blk.31.ffn_down.weight - [14336,  4096,     1,     1], type =    f16, converting to q4_0 .. size =   112.00 MiB ->    31.50 MiB
[ 290/ 292]               blk.31.ffn_gate.weight - [ 4096, 14336,     1,     1], type =    f16, converting to q4_0 .. size =   112.00 MiB ->    31.50 MiB
[ 291/ 292]               blk.31.ffn_norm.weight - [ 4096,     1,     1,     1], type =    f32, size =    0.016 MB
[ 292/ 292]                 blk.31.ffn_up.weight - [ 4096, 14336,     1,     1], type =    f16, converting to q4_0 .. size =   112.00 MiB ->    31.50 MiB
llama_model_quantize_impl: model size  = 15317.02 MB
llama_model_quantize_impl: quant size  =  4437.80 MB

main: quantize time = 17884.06 ms
main:    total time = 17884.06 ms
```

在進行完量化後，模型大小差異如下：

```
原本為 15GB，量化後為 4.4GB
llama_model_quantize_impl: model size  = 15317.02 MB
llama_model_quantize_impl: quant size  =  4437.80 MB
```

## 部署 AI 應用

### 透過 llama-cli 進行推論
直接使用 Chat CLI 來與模型進行互動，透過以下指令來進行推論：

```bash
./build/bin/llama-cli -m ./ds-r1-distill-llama-8b/ds-r1-distill-llama-8B-Q4_0.gguf
```

然後你會馬上發現，似乎 GPU 沒有被使用到，那就對了，這時會在 log 中發現以下資訊：

```
load_tensors: loading model tensors, this can take a while... (mmap = true)
load_tensors: offloading 0 repeating layers to GPU
load_tensors: offloaded 0/33 layers to GPU
load_tensors:  CPU_AARCH64 model buffer size =  3744.00 MiB
load_tensors:   CPU_Mapped model buffer size =  4406.30 MiB
```

告訴你他只使用了 CPU 的部分，並沒有將模型放到 GPU 上來進行加速。

你需要指定 `-ngl 層數` 來指定要放到 GPU 上的層數，例如：

```bash
./build/bin/llama-cli -m ./ds-r1-distill-llama-8b/ds-r1-distill-llama-8B-Q4_0.gguf -ngl 33
```

這時就會看見 GPU 被使用到了：

```
load_tensors: loading model tensors, this can take a while... (mmap = true)
load_tensors: offloading 32 repeating layers to GPU
load_tensors: offloading output layer to GPU
load_tensors: offloaded 33/33 layers to GPU
load_tensors:        CUDA0 model buffer size =  4155.99 MiB
load_tensors:   CPU_Mapped model buffer size =   281.81 MiB
```

### 透過 llama-server 啟動 OpenAI 相容的 API 伺服器

透過以下指令來啟動 llama-server：

```bash
./build/bin/llama-server -m ./ds-r1-distill-llama-8b/ds-r1-distill-llama-8B-Q4_0.gguf -ngl 33
```

原則上就是把上面的 `cli` 換成 `server` 就可以囉！

#### 如何與之互動

請查詢 OpenAI API 該如何使用，你可以直接將任何支援 OpenAI API endpoint 的工具與服務換成 llama-server 啟動的伺服器。

以下只是示範如何使用 `curl` 來發送請求，並使用 `jq` 來渲染輸出結果
```bash
curl -X POST http://localhost:8080/v1/chat/completions \
    -H 'accept:application/json' \
    -H 'Content-Type: application/json' \
    -d '{"messages":[{"role":"system", "content": "You are a helpful assistant. Reply questions in less than five words."}, {"role":"user", "content": "What is the capital of Japan?"}], "model":"default"}' | jq .

# 輸出結果

{
  "choices": [
    {
      "finish_reason": "stop",
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "<think>\nOkay, so I need to figure out the capital of Japan. Hmm, I'm not entirely sure, but I think it's a country that's pretty well-known, so maybe I can recall it from memory. Let me try to think. I remember that Tokyo is a major city there. Wait, is Tokyo the capital? Or is it another city? I think I've heard that Tokyo is both the capital and the largest city. I'm pretty sure other countries have capitals that are also their biggest cities, like Washington D.C. in the U.S. So applying that logic, Japan's capital should be Tokyo. I don't think it's Osaka or Nagasaki because those are other major cities, but I'm almost certain the capital is Tokyo. Yeah, I feel confident about that.\n</think>\n\nTokyo"
      }
    }
  ],
  "created": 1741332025,
  "model": "default",
  "system_fingerprint": "b4845-d6c95b07",
  "object": "chat.completion",
  "usage": {
    "completion_tokens": 167,
    "prompt_tokens": 24,
    "total_tokens": 191
  },
  "id": "chatcmpl-cRBfkobRrFxvmeQxxL6ZYipDB60TSmQr",
  "timings": {
    "prompt_n": 13,
    "prompt_ms": 806.983,
    "prompt_per_token_ms": 62.07561538461538,
    "prompt_per_second": 16.109385203901446,
    "predicted_n": 167,
    "predicted_ms": 17762.902,
    "predicted_per_token_ms": 106.36468263473053,
    "predicted_per_second": 9.401616920478423
  }
}
```

## 結語
本文以 `llama.cpp b4845 (d6c95b07)` 做教學，由於 llama.cpp 是非常活躍的專案，因此上述的工具參數可能有所修改，如發現該指令無法正確執行，請使用 `--help` 或者 `-h` 來查看最新的參數應該如何使用。
希望本文能讓想使用 NVIDIA Jetson 系列開發版的開發者們，能夠輕鬆上手 llama.cpp，並更快速地部署 AI 應用。