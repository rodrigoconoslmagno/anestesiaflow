package br.com.anestesiaflow.procedimento.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import br.com.anestesiaflow.exception.BusinessException;
import br.com.anestesiaflow.procedimento.dto.ProcedimentoRequestDTO;
import br.com.anestesiaflow.procedimento.dto.ProcedimentoResponseDTO;
import br.com.anestesiaflow.procedimento.entidade.Procedimento;
import br.com.anestesiaflow.procedimento.repository.ProcedimentoRepository;
import jakarta.transaction.Transactional;

@Service
public class ProcedimentoService {

    @Autowired
    private ProcedimentoRepository procedimentoRepository;

    public List<ProcedimentoResponseDTO> listarTodos(){
		return procedimentoRepository.findAll().stream()
				.map(this::mapperToDto)
				.toList();
	}
	
	public List<ProcedimentoResponseDTO> listarAtivos(){
		return procedimentoRepository.findAll().stream()
				.filter(procedimento -> procedimento.isAtivo())
				.map(this::mapperToDto)
				.toList();
	}

    public ProcedimentoResponseDTO buscaId(Integer id) {
		Procedimento procedimento = procedimentoRepository.findById(id).orElseThrow(() -> new BusinessException("Procedimento não encontrado")); 
		return mapperToDto(procedimento);
	}
	
	@Transactional
	public ProcedimentoResponseDTO salvar(ProcedimentoRequestDTO dto) {
		return mapperToDto(procedimentoRepository.save(mapperToProcedimento(dto)));
	}
	
	@Transactional
	public ProcedimentoResponseDTO atualizar(int id, ProcedimentoRequestDTO request) {
	    Procedimento procedimento = procedimentoRepository.findById(id)
	            .orElseThrow(() -> new BusinessException("Procedimento não encontrado"));
	    
	    procedimento = mapperToProcedimento(procedimento, request);

	    return mapperToDto(procedimentoRepository.save(procedimento));
	}	
	
	@Transactional
	public void excluir(int id) {
	    // Verifica se existe antes de deletar
	    if (!procedimentoRepository.existsById(id)) {
	        throw new BusinessException("Procedimento não encontrado com o ID: " + id);
	    }
	    
	    procedimentoRepository.deleteById(id);
	}

    private ProcedimentoResponseDTO mapperToDto(Procedimento procedimento) {
        return new ProcedimentoResponseDTO(
            procedimento.getId(), 
            procedimento.getDescricao(), 
            procedimento.isAtivo(),
            procedimento.getDataCriacao(),
            procedimento.getDataAtualizacao());
    }

    private Procedimento mapperToProcedimento(ProcedimentoRequestDTO dto) {
        Procedimento procedimento = new Procedimento();
        procedimento.setDescricao(dto.descricao());
        procedimento.setAtivo(dto.ativo());
        return procedimento;
    }

    private Procedimento mapperToProcedimento(Procedimento procedimento, ProcedimentoRequestDTO dto) {
        procedimento.setDescricao(dto.descricao());
        procedimento.setAtivo(dto.ativo());
        return procedimento;
    }
}
