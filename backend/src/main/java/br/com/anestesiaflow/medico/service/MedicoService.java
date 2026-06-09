package br.com.anestesiaflow.medico.service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import br.com.anestesiaflow.exception.BusinessException;
import br.com.anestesiaflow.medico.dto.MedicoRequestDTO;
import br.com.anestesiaflow.medico.dto.MedicoResponseDTO;
import br.com.anestesiaflow.medico.model.Medico;
import br.com.anestesiaflow.medico.model.MedicoEspecialidade;
import br.com.anestesiaflow.medico.repository.MedicoRepository;
import jakarta.transaction.Transactional;

@Service
public class MedicoService {

	@Autowired
	private MedicoRepository medicoRepository;
	
	public List<MedicoResponseDTO> listarTodos(){
		return medicoRepository.findAll().stream()
				.sorted(Comparator.comparing(Medico::getDataAssociacao))
				.map(medico -> mapperToDto(medico))
				.toList();
	}
	
	public List<MedicoResponseDTO> listar(Map<String, Object> filtros) {
		String sigla = null;
		Boolean ativo = null;
		String especialidades = null;

		if (filtros != null) {
			sigla = normalizarTexto(filtros.get("sigla"));
			ativo = normalizarBooleano(filtros.get("ativo"));
			especialidades = toEspecialidadesCsv(filtros.get("especialidades"));
		}

		return medicoRepository.filtrarMedicos(sigla, ativo, especialidades).stream()
				.map(this::mapperToDto)
				.toList();
	}

	public List<MedicoResponseDTO> listarAtivos(){
		return medicoRepository.findAll().stream()
				.filter(medico -> medico.isAtivo())
				.sorted(Comparator.comparing(Medico::getDataAssociacao))
				.map(this::mapperToDto)
				.toList();
	}
	
	public MedicoResponseDTO buscaId(Integer id) {
		Medico medico = medicoRepository.findById(id).orElseThrow(() -> new BusinessException("Médico não encontrado")); 
		return mapperToDto(medico);
	}
	
	public MedicoResponseDTO salvar(MedicoRequestDTO dto) {
		return mapperToDto(medicoRepository.save(mapperToMedico(dto)));
	}
	
	@Transactional
	public MedicoResponseDTO atualizar(int id, MedicoRequestDTO request) {
	    // 1. Busca o usuário existente ou lança exceção (fail-fast)
	    Medico medico = medicoRepository.findById(id)
	            .orElseThrow(() -> new BusinessException("Médico não encontrado"));
	    
	    medico = mapperToMedico(medico, request);

	    return mapperToDto(medicoRepository.save(medico));
	}	
	
	@Transactional
	public void excluir(int id) {
	    // Verifica se existe antes de deletar
	    if (!medicoRepository.existsById(id)) {
	        throw new BusinessException("Médico não encontrado com o ID: " + id);
	    }
	    
	    medicoRepository.deleteById(id);
	}
	
	private MedicoResponseDTO mapperToDto(Medico medico) {
		List<Integer> especialidadeCodigos = medico.getEspecialidades().stream()
			.map(MedicoEspecialidade::getCodigo)
			.collect(Collectors.toList());
		
		String especialidadesDescricao = medico.getEspecialidades().stream()
			.map(MedicoEspecialidade::getDescricao)
			.collect(Collectors.joining(", "));
		
		return new MedicoResponseDTO(
				medico.getId(), 
				medico.getNome(), 
				medico.getSigla(), 
				medico.getDataAssociacao(),
				especialidadeCodigos,
				especialidadesDescricao,
				medico.isAtivo(), 
				medico.getDataCriacao(), 
				medico.getDataAtualizacao());
	}

	private String normalizarTexto(Object valor) {
		if (valor == null) {
			return null;
		}
		String texto = valor.toString().trim();
		return texto.isEmpty() ? null : texto;
	}

	private Boolean normalizarBooleano(Object valor) {
		if (valor == null) {
			return null;
		}
		if (valor instanceof Boolean bool) {
			return bool;
		}
		String texto = valor.toString().trim();
		if (texto.isEmpty()) {
			return null;
		}
		return Boolean.valueOf(texto);
	}

	private String toEspecialidadesCsv(Object valor) {
		if (!(valor instanceof List<?> ids) || ids.isEmpty()) {
			return null;
		}

		return ids.stream()
				.map(id -> MedicoEspecialidade.porCodigo(Integer.parseInt(id.toString())))
				.filter(Objects::nonNull)
				.map(MedicoEspecialidade::getCodigo)
				.map(String::valueOf)
				.collect(Collectors.joining(","));
	}
	
	private Medico mapperToMedico(MedicoRequestDTO dto) {
		Medico medico = new Medico();
		medico.setNome(dto.nome());
		medico.setSigla(dto.sigla());
		medico.setDataAssociacao(dto.dataAssociacao());
		medico.setAtivo(dto.ativo());
		
		if (dto.especialidades() != null && !dto.especialidades().isEmpty()) {
			List<MedicoEspecialidade> especialidades = dto.especialidades().stream()
				.map(codigo -> MedicoEspecialidade.porCodigo(codigo))
				.filter(esp -> esp != null)
				.collect(Collectors.toList());
			medico.setEspecialidades(especialidades);
		}
		
		return medico;
	}
	
	private Medico mapperToMedico(Medico medico, MedicoRequestDTO dto) {
		medico.setNome(dto.nome());
		medico.setSigla(dto.sigla());
		medico.setDataAssociacao(dto.dataAssociacao());
		medico.setAtivo(dto.ativo());
		
		if (dto.especialidades() != null && !dto.especialidades().isEmpty()) {
			List<MedicoEspecialidade> especialidades = dto.especialidades().stream()
				.map(codigo -> MedicoEspecialidade.porCodigo(codigo))
				.filter(esp -> esp != null)
				.collect(Collectors.toList());
			medico.setEspecialidades(especialidades);
		} else {
			medico.setEspecialidades(new java.util.ArrayList<>());
		}
		
		return medico;
	}
}
