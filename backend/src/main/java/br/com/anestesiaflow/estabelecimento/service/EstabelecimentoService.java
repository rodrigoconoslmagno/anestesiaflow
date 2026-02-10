package br.com.anestesiaflow.estabelecimento.service;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import br.com.anestesiaflow.estabelecimento.dto.EstabelecimentoRequestDTO;
import br.com.anestesiaflow.estabelecimento.dto.EstabelecimentoResponseDTO;
import br.com.anestesiaflow.estabelecimento.model.Estabelecimento;
import br.com.anestesiaflow.estabelecimento.repository.EstabelecimentoRepository;
import br.com.anestesiaflow.exception.BusinessException;
import jakarta.transaction.Transactional;

@Service
public class EstabelecimentoService {

	@Autowired
	private EstabelecimentoRepository estRepository;
	
	public List<EstabelecimentoResponseDTO> listarTodos(){
		return estRepository.findAll().stream()
				.map(estabeleciomento -> mapperToDto(estabeleciomento))
				.toList();
	}
	
	public EstabelecimentoResponseDTO salvar(EstabelecimentoRequestDTO dto) {
		validarCorIcone(dto);
		return mapperToDto(estRepository.save(mapperToEstabelecimento(dto)));
	}
	
	@Transactional
	public EstabelecimentoResponseDTO atualizar(int id, EstabelecimentoRequestDTO request) {
	    // 1. Busca o usuário existente ou lança exceção (fail-fast)
	    Estabelecimento estabelecimento = estRepository.findById(id)
	            .orElseThrow(() -> new BusinessException("Estabelecimento não encontrado"));
	    
	    validarCorIcone(request);
	    
	    estabelecimento = mapperToEstabelecimento(estabelecimento, request);

	    return mapperToDto(estRepository.save(estabelecimento));
	}	
	
	@Transactional
	public void excluir(int id) {
	    // Verifica se existe antes de deletar
	    if (!estRepository.existsById(id)) {
	        throw new BusinessException("Médico não encontrado com o ID: " + id);
	    }
	    
	    estRepository.deleteById(id);
	}
	
	
	private EstabelecimentoResponseDTO mapperToDto(Estabelecimento estabelecimento) {
		return new EstabelecimentoResponseDTO(
				estabelecimento.getId(), 
				estabelecimento.getNome(), 
				estabelecimento.getCor(),
				estabelecimento.getIcone(), 
				estabelecimento.isAtivo(), 
				estabelecimento.getDataCriacao(), 
				estabelecimento.getDataAtualizacao());
	}
	
	private Estabelecimento mapperToEstabelecimento(EstabelecimentoRequestDTO dto) {
		Estabelecimento estabelecimento = new Estabelecimento();
		estabelecimento.setNome(dto.nome());
		estabelecimento.setCor(dto.cor());
		estabelecimento.setIcone(dto.icone());
		estabelecimento.setAtivo(dto.ativo());
		
		return estabelecimento;
	}
	
	private Estabelecimento mapperToEstabelecimento(Estabelecimento estabelecimento, EstabelecimentoRequestDTO dto) {
		estabelecimento.setNome(dto.nome());
		estabelecimento.setCor(dto.cor());
		estabelecimento.setIcone(dto.icone());
		estabelecimento.setAtivo(dto.ativo());
		
		return estabelecimento;
	}
	
	private void validarCorIcone(EstabelecimentoRequestDTO dto) {
		if ((dto.cor() == null || dto.cor().isBlank()) && (dto.icone() == null || dto.icone().length == 0)) {
			throw new BusinessException("É necessário selecionar uma cor ou um icone");
		}
		
		if (dto.cor() != null && dto.icone() != null) {
			throw new BusinessException("Selecionar APENAS uma cor ou um icone");
		}
	}
}