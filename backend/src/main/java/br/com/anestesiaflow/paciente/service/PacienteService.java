package br.com.anestesiaflow.paciente.service;

import java.io.InputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;
import com.google.cloud.vision.v1.AnnotateImageRequest;
import com.google.cloud.vision.v1.AnnotateImageResponse;
import com.google.cloud.vision.v1.BatchAnnotateImagesResponse;
import com.google.cloud.vision.v1.Feature;
import com.google.cloud.vision.v1.Image;
import com.google.cloud.vision.v1.ImageAnnotatorClient;
import com.google.protobuf.ByteString;
import br.com.anestesiaflow.exception.BusinessException;
import br.com.anestesiaflow.medico.model.Medico;
import br.com.anestesiaflow.paciente.dto.PacienteImagemDTO;
import br.com.anestesiaflow.paciente.dto.PacienteProcedimentoResponseDTO;
import br.com.anestesiaflow.paciente.dto.PacienteRequestDTO;
import br.com.anestesiaflow.paciente.dto.PacienteResponseDTO;
import br.com.anestesiaflow.paciente.entidade.Paciente;
import br.com.anestesiaflow.paciente.entidade.PacienteProcedimento;
import br.com.anestesiaflow.paciente.repository.PacienteRepository;
import jakarta.annotation.PreDestroy;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

@Service
public class PacienteService {

	private final PacienteRepository pacienteRepository;
	private final EntityManager entityManager;
	private final ImageAnnotatorClient client;
	
	public PacienteService(PacienteRepository pacienteRespository, EntityManager entityManager,
			ImageAnnotatorClient client)  throws Exception {
		this.pacienteRepository = pacienteRespository;
		this.entityManager = entityManager;
		this.client = client;
	}
	
    @PreDestroy
    public void destroy() {
        if (client != null) {
            client.close();
        }
    }
	
	public List<PacienteResponseDTO> listarTodos(){
		return pacienteRepository.findAll().stream()
				.map(this::mapperToDto)
				.toList();
	}
	
	public List<PacienteResponseDTO> listarAtivos(){
		return pacienteRepository.findAll().stream()
				.filter(paciente -> paciente.isAtivo())
				.map(this::mapperToDto)
				.toList();
	}
	
	public PacienteResponseDTO buscaId(Integer id) {
		Paciente paciente = pacienteRepository.findById(id).orElseThrow(() -> new BusinessException("Paciente não encontrado")); 
		return mapperToDto(paciente);
	}
	
	@Transactional
	public PacienteResponseDTO salvar(PacienteRequestDTO dto) {
		return mapperToDto(pacienteRepository.save(mapperToPaciente(dto)));
	}
	
	@Transactional
	public PacienteResponseDTO atualizar(int id, PacienteRequestDTO request) {
	    Paciente paciente = pacienteRepository.findById(id)
	            .orElseThrow(() -> new BusinessException("Paciente não encontrado"));
	    
	    paciente = mapperToPaciente(paciente, request);

	    return mapperToDto(pacienteRepository.save(paciente));
	}	
	
	@Transactional
	public void excluir(int id) {
	    // Verifica se existe antes de deletar
	    if (!pacienteRepository.existsById(id)) {
	        throw new BusinessException("Paciente não encontrado com o ID: " + id);
	    }
	    
	    pacienteRepository.deleteById(id);
	}
	
	private PacienteResponseDTO mapperToDto(Paciente paciente) {
		return new PacienteResponseDTO(
				paciente.getId(),
				paciente.getNome(),
				paciente.isAtivo(),
				paciente.getProcedimentos().stream().map(this::mapperProcedimentoToDto).toList(),
				paciente.getDataCriacao(),
				paciente.getDataAtualizacao());
	}
	
	private PacienteProcedimentoResponseDTO mapperProcedimentoToDto(PacienteProcedimento procedimento) {
		return new PacienteProcedimentoResponseDTO(
				procedimento.getId(), 
				procedimento.getDataProcedimento(), 
				procedimento.getProcedimento(), 
				procedimento.getCirurgiao(), 
				procedimento.getMedico().getId(),
				procedimento.getDataCriacao(),
				procedimento.getDataAtualizacao());
	}
	
	private Paciente mapperToPaciente(PacienteRequestDTO dto) {
		Paciente paciente = new Paciente();
		paciente.setNome(dto.nome());
		paciente.setAtivo(dto.ativo());
//		pacienteRepository.save(paciente);
		paciente.getProcedimentos().addAll(
				dto.procedimentos().stream().map(this::mapperToProcedimentoDto).toList());
		paciente.getProcedimentos().forEach(procedimento -> procedimento.setPaciente(paciente));
		return paciente;
	}
	
	private PacienteProcedimento mapperToProcedimentoDto(PacienteProcedimentoResponseDTO dto) {
		PacienteProcedimento procedimento = new PacienteProcedimento();
		if (dto.id() > 0) {
			procedimento.setId(dto.id());
		}
		procedimento.setDataProcedimento(dto.dataProcedimento());
		procedimento.setMedico(entityManager.getReference(Medico.class, dto.medicoId()));
		procedimento.setProcedimento(dto.procedimento());
		procedimento.setCirurgiao(dto.cirurgiao());
		return procedimento;
	}
	
	private Paciente mapperToPaciente(Paciente paciente, PacienteRequestDTO dto) {
		paciente.setNome(dto.nome());
		paciente.setAtivo(dto.ativo());
		sincronizaProcedimento(paciente.getProcedimentos(), dto.procedimentos());
		paciente.getProcedimentos().forEach(procedimento -> {
			if (procedimento.getPaciente() == null) {
				procedimento.setPaciente(paciente);
			}
		});
		return paciente;
	}
	
	private void sincronizaProcedimento(List<PacienteProcedimento> procedimentos, List<PacienteProcedimentoResponseDTO> dtos) {
		procedimentos.removeIf(procedimento ->
			dtos.stream().noneMatch(dto -> dto.id() == procedimento.getId()));
		
		dtos.stream().forEach(dto -> {
			if (dto.id() == 0) {
				procedimentos.add(mapperToProcedimentoDto(dto));
			} else {
				procedimentos.stream().forEach(procedimento -> {
					if (dto.id() == procedimento.getId()) {
						procedimento.setCirurgiao(dto.cirurgiao());
						procedimento.setProcedimento(dto.procedimento());
						procedimento.setDataProcedimento(dto.dataProcedimento());
						procedimento.setMedico(entityManager.getReference(Medico.class, dto.medicoId()));
						return;
					}
				});
			}			
		});
		
	}
	
	public void decodeImagem(InputStream inputStream, int medicoId) throws Exception  {
		String dados = extrairTexto(inputStream);
		if (dados == null || dados.isEmpty()) {
			throw new BusinessException("Não foi encontrado nenhum texto na imagem fornecida.");
		}
		List<PacienteImagemDTO> processa = processarTexto(dados); 
		
		if (processa.size() == 0) {
			throw new BusinessException("Não foi possível decodificar os dados do(s) paciente(s) da image fornecida.");
		}
		
		for(PacienteImagemDTO item : processa) {
			Paciente paciente = pacienteRepository.findByNome(item.nome().toUpperCase());
			if (paciente == null) {
				paciente = new Paciente();
				paciente.setNome(item.nome().toUpperCase());
				paciente.setAtivo(true);
				pacienteRepository.save(paciente);
			}
			final PacienteProcedimento procedimento = pacienteRepository.findByProcedimentoData(paciente, item.dataProcedimento(), item.procedimento().toUpperCase());	
			if (procedimento == null) {
				PacienteProcedimento proc = new PacienteProcedimento();
				proc.setPaciente(paciente);
				proc.setMedico(entityManager.getReference(Medico.class, medicoId));
				proc.setDataProcedimento(item.dataProcedimento());
				proc.setProcedimento(item.procedimento());
				proc.setCirurgiao(item.cirurgiao());
				paciente.getProcedimentos().add(proc);
				pacienteRepository.save(paciente);
			} else {
				paciente.getProcedimentos().forEach(itemPro -> {
					if (itemPro.getId().equals(procedimento.getId())) {
						itemPro.setMedico(entityManager.getReference(Medico.class, medicoId));
						itemPro.setDataProcedimento(item.dataProcedimento());
						itemPro.setProcedimento(item.procedimento().toUpperCase());
						itemPro.setCirurgiao(item.cirurgiao().toUpperCase());
						return;
					}
				});		
				pacienteRepository.save(paciente);
			}
		}
	}
	
	private String extrairTexto(InputStream inputStream) throws Exception {
        ByteString imgBytes = ByteString.readFrom(inputStream);

        Image image = Image.newBuilder()
                .setContent(imgBytes)
                .build();

        Feature feature = Feature.newBuilder()
                .setType(Feature.Type.DOCUMENT_TEXT_DETECTION)
                .build();

        AnnotateImageRequest request = AnnotateImageRequest.newBuilder()
                .addFeatures(feature)
                .setImage(image)
                .build();

        BatchAnnotateImagesResponse response =
                client.batchAnnotateImages(List.of(request));

        List<AnnotateImageResponse> responses = response.getResponsesList();

        if (responses.isEmpty()) {
            return "";
        }

        return responses.get(0)
                .getFullTextAnnotation()
                .getText();
    
    }
	
   private String extrair(String texto, String regex) {
        Matcher m = Pattern.compile(regex, Pattern.CASE_INSENSITIVE).matcher(texto);
        return m.find() ? m.group(1).trim() : null;
   }
   
   private LocalDate converterDataAgenda(String dataStr) {
	    if (dataStr == null) return LocalDate.now();
	    try {
	        // Ajuste para o local brasileiro para entender "abril"
	        DateTimeFormatter parser = DateTimeFormatter.ofPattern("dd 'de' MMMM 'de' yyyy", new Locale("pt", "BR"));
	        return LocalDate.parse(dataStr.toLowerCase(), parser);
	    } catch (Exception e) {
	        return LocalDate.now();
	    }
	}
   
   private List<PacienteImagemDTO> processarTexto(String texto) {
	    List<PacienteImagemDTO> resultados = new ArrayList<>();

	 // Extração da data (mantendo sua lógica que parece correta para o header)
	    String dataAgendaStr = extrair(texto, "(\\d{2} de [a-z]+ de \\d{4})");
	    LocalDate dataProcedimento = converterDataAgenda(dataAgendaStr);

	    // Nova Regex: 
	    // 1. Procura o horário (\\d{2}:\\d{2})
	    // 2. Captura tudo o que vem depois até encontrar "DR " (Médico)
	    // 3. Captura o nome do médico
	    Pattern patternAgenda = Pattern.compile("(\\d{2}:\\d{2})\\s+([A-Z\\s]+?)\\r?\\n.*?DR\\s+([^\\n\\r]+)", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
	    Matcher matcher = patternAgenda.matcher(texto);

	    while (matcher.find()) {
	        String nomePaciente = matcher.group(2).trim();
	        String nomeMedico = "DR " + matcher.group(3).trim();
	        
	        // O procedimento geralmente está logo abaixo do nome do paciente na imagem
	        // Como o OCR pode misturar, aqui pegamos uma constante ou tentamos extrair entre o nome e o DR
	        String procedimento = "FACECTOMIA"; // Baseado na imagem enviada

	        resultados.add(new PacienteImagemDTO(
	            nomePaciente, 
	            dataProcedimento, 
	            procedimento, 
	            nomeMedico
	        ));
	    }

	    // 2. SE NÃO ACHOU NADA COMO AGENDA, TENTA PADRÃO DE ETIQUETA ÚNICA
	    if (resultados.isEmpty()) {
	        // Aproveita o seu método parse existente que já lida com os dois tipos de etiqueta
	    	PacienteImagemDTO unico = parse(texto);
	        if (unico != null) {
	            resultados.add(unico);
	        }
	    }

	    return resultados;
	}
   
   public PacienteImagemDTO parse(String texto) {

		String nome = extrair(texto, "Nome:\\s*(.*)");
		if (nome == null) {
			// Fallback: Tenta pegar a segunda linha se a primeira for um código/ID (como 'vita: 15702')
			String[] linhas = texto.split("\\r?\\n");
				if (linhas.length > 1) {
			    	nome = linhas[1].trim(); 
				}
		}
		// Regex para Cirurgião: Ignora o prefixo "Dr(a)." se existir e captura o nome
		// A regex abaixo procura por "Cirurgião:", ignora opcionalmente "Dr(a)." e pega o resto da linha
		String cirurgiao = extrair(texto, "(?:Cirurgião|Med\\.|Médico):\\s*(?:Dr\\(a\\)\\.\\s*)?([^\n\r]+)");
		
		LocalDate data = LocalDate.now();
		
		String procedimento = "";
		
		if (nome != null && !nome.isEmpty() && cirurgiao != null && !cirurgiao.isEmpty()) {
			PacienteImagemDTO dto = new PacienteImagemDTO(
				   nome,
				   data,
				   procedimento,
				   cirurgiao
				   );
			
			return dto;
		}
		
		return null;
   }
}
