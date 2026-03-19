package br.com.anestesiaflow.plantao.service;

import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.anestesiaflow.escala.entidade.Escala;
import br.com.anestesiaflow.escala.entidade.EscalaItem;
import br.com.anestesiaflow.escala.repository.EscalaRepository;
import br.com.anestesiaflow.estabelecimento.dto.EstabelecimentoResponseDTO;
import br.com.anestesiaflow.estabelecimento.model.Estabelecimento;
import br.com.anestesiaflow.medico.dto.MedicoResponseDTO;
import br.com.anestesiaflow.medico.model.Medico;
import br.com.anestesiaflow.plantao.dto.EscalaItemPlantaoDTO;
import br.com.anestesiaflow.plantao.dto.EscalaPlantaoDTO;
import jakarta.persistence.EntityManager;

@Service
public class PlantaoService {

	private final EntityManager entityManager;
	private final EscalaRepository escalaRepository;
	
	public PlantaoService(EntityManager entityManager, EscalaRepository escalaRepository) {
		this.entityManager = entityManager;
		this.escalaRepository = escalaRepository;
	}
	
	public List<EscalaPlantaoDTO> listarPorData(LocalDate data){
		return escalaRepository.findByDataAndPlantao(data, true).
				stream().map(this::mapperEstalaToPlantao).
				filter(escalaBando -> escalaBando.itensPlantao().size() > 0).toList();
	}

	@Transactional
	public EscalaPlantaoDTO salvar(EscalaPlantaoDTO dto) {
		Escala persiste = null;
		if (dto.id() > 0) {
			persiste = escalaRepository.findById(dto.id()).orElse(null);
		}
		
		if (persiste == null) {
			persiste = escalaRepository.findByMedico_IdAndDataAndPlantao(dto.medicoId(), dto.data(), true);
		}
		
		if (persiste == null) {			
			persiste = mapperPlantaoToEscala(dto);
		} else {
			mergeItens(dto, persiste);
		}
		
		if (persiste.getItens().size() == 0) {
			escalaRepository.delete(persiste);
			return null;
		}
		
		persiste = escalaRepository.save(persiste);
		return mapperEstalaToPlantao(persiste);
	}
	
	private void mergeItens(EscalaPlantaoDTO dto, Escala escala) {
		boolean encontrou = false;
		escala.getItens().removeIf(itemBanco -> 
					itemBanco.getArquivado() == null &&
					dto.itensPlantao().stream().noneMatch(itemDto -> 
									itemBanco.getEstabelecimento().getId().equals(itemDto.estabelecimentoId()) &&
									itemBanco.getHora().equals(itemDto.hora())));
		
		for(EscalaItemPlantaoDTO itemDto : dto.itensPlantao()) {
			encontrou = false;
			for(EscalaItem item : escala.getItens()) {
				if (itemDto.estabelecimentoId() == item.getEstabelecimento().getId() &&
						itemDto.hora().equals(item.getHora())) {
					encontrou = true;
					break;
				}				
			}
			
			if (!encontrou) {
				EscalaItem itemEscala = mapperItemToEscalaItem(itemDto);
				itemEscala.setEscala(escala);
				escala.getItens().add(itemEscala);
			}
		}
		
		for(EscalaItem itemBanco : escala.getItens()) {
			if (itemBanco.getArquivado() != null) {
				itemBanco.setReagendado(!dto.itensPlantao().stream().anyMatch(itemDto ->
						itemBanco.getEstabelecimento().getId().equals(itemDto.estabelecimentoId()) &&
						itemBanco.getHora().equals(itemDto.hora())
						));
			}
		}
	}
	
	public int arquivarPlantao(LocalDate date) {
		return escalaRepository.arquivarItensPorData(date); 
	}
	
	public boolean existeArquivo(LocalDate data) {
		boolean habilitaArquivar = escalaRepository.existsByDataAndOptionalMedico(data, null); 
		if (habilitaArquivar) {
			habilitaArquivar = escalaRepository.countConsultasArquivadas(data, null) == 0;
		}
		
		return !habilitaArquivar;
	}
	
	public List<LocalDate> datasPlantao(LocalDate inicio, LocalDate fim) {
		return escalaRepository.findDias(inicio, fim, true);
	}
	
	private EscalaPlantaoDTO mapperEstalaToPlantao(Escala escala) {
		return new EscalaPlantaoDTO(
				escala.getId(),
				escala.getData(),
				escala.getMedico().getId(),
				mapperMetocoToDto(escala.getMedico()),
				escala.isPlantao(),
				escala.getItens().stream()
						.filter(itemBanco -> !itemBanco.isReagendado())
						.map(this::mapperItemToPlantao).toList());
	}
	
	private MedicoResponseDTO mapperMetocoToDto(Medico medico) {
		return new MedicoResponseDTO(
				medico.getId(),
				medico.getNome(),
				medico.getSigla(),
				medico.getDataAssociacao(),
				medico.isAtivo(),
				medico.getDataCriacao(),
				medico.getDataAtualizacao()
		);
	}
	
	private EscalaItemPlantaoDTO mapperItemToPlantao(EscalaItem item) {
		return new EscalaItemPlantaoDTO(
				item.getId(),
				mapperEstabelecimentoToDto(item.getEstabelecimento()),
				item.getEstabelecimento().getId(),
				item.getArquivado(),
				item.isReagendado(),
				item.getHora(),
				item.getEstabelecimento().getCor(),
				item.getEstabelecimento().getIcone()
		);
	}
	
	private EstabelecimentoResponseDTO mapperEstabelecimentoToDto(Estabelecimento estabelecimento) {
		return new EstabelecimentoResponseDTO(
				estabelecimento.getId(), 
				estabelecimento.getNome(), 
				estabelecimento.getCor(), 
				estabelecimento.getSigla(), 
				estabelecimento.getIcone(), 
				estabelecimento.isPlantao(), 
				estabelecimento.isAtivo(), 
				estabelecimento.getDataCriacao(), 
				estabelecimento.getDataAtualizacao());
	}
	
	private Escala mapperPlantaoToEscala(EscalaPlantaoDTO dto) {
		Escala retorno = new Escala();
		retorno.setData(dto.data());
		retorno.setMedico(entityManager.getReference(Medico.class, dto.medicoId()));
		retorno.setPlantao(dto.plantao());
		retorno.getItens().addAll(dto.itensPlantao().stream().map(itemDto -> {
				EscalaItem item = mapperItemToEscalaItem(itemDto);
				item.setEscala(retorno);
				return item;
		}).toList());
		return retorno;
	}

	private EscalaItem mapperItemToEscalaItem(EscalaItemPlantaoDTO dto) {
		EscalaItem retorno = new EscalaItem();
		retorno.setEstabelecimento(entityManager.getReference(Estabelecimento.class, dto.estabelecimentoId()));
		retorno.setHora(dto.hora());
		retorno.setArquivado(dto.arquivado());
		retorno.setReagendado(dto.reagendado());		
		return retorno;
	}
}