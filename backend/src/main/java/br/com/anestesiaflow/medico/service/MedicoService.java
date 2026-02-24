package br.com.anestesiaflow.medico.service;

import java.util.Comparator;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import br.com.anestesiaflow.exception.BusinessException;
import br.com.anestesiaflow.medico.dto.MedicoRequestDTO;
import br.com.anestesiaflow.medico.dto.MedicoResponseDTO;
import br.com.anestesiaflow.medico.model.Medico;
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
		return new MedicoResponseDTO(
				medico.getId(), 
				medico.getNome(), 
				medico.getSigla(), 
				medico.getDataAssociacao(),
				medico.isAtivo(), 
				medico.getDataCriacao(), 
				medico.getDataAtualizacao());
	}
	
	private Medico mapperToMedico(MedicoRequestDTO dto) {
		Medico medico = new Medico();
		medico.setNome(dto.nome());
		medico.setSigla(dto.sigla());
		medico.setDataAssociacao(dto.dataAssociacao());
		medico.setAtivo(dto.ativo());
		return medico;
	}
	
	private Medico mapperToMedico(Medico medico, MedicoRequestDTO dto) {
		medico.setNome(dto.nome());
		medico.setSigla(dto.sigla());
		medico.setDataAssociacao(dto.dataAssociacao());
		medico.setAtivo(dto.ativo());
		return medico;
	}
}
