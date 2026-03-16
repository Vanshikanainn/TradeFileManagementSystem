package com.trade.service.serviceImpl;

import com.trade.dao.repository.FileLoadRepository;
import com.trade.model.dto.FileLoadRequestDTO;
import com.trade.model.dto.FileLoadResponseDTO;
import com.trade.model.dto.SearchCriteriaDTO;
import com.trade.model.entity.FileLoad;
import com.trade.service.service.FileLoadService;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FileLoadServiceImpl implements FileLoadService {

    private final FileLoadRepository repository;

    public FileLoadServiceImpl(FileLoadRepository repository) {
        this.repository = repository;
    }

    @Override
    public FileLoadResponseDTO createFileLoad(FileLoadRequestDTO request) {

        FileLoad file = new FileLoad();
        file.setFilename(request.getFilename());
        file.setLoadDate(LocalDateTime.now());
        file.setStatus("PENDING");

        FileLoad saved = repository.save(file);

        return mapToDTO(saved);
    }

    @Override
    public FileLoadResponseDTO getFileLoadById(Long id) {

        FileLoad file = repository.findById(id).orElseThrow();

        return mapToDTO(file);
    }

    @Override
    public List<FileLoadResponseDTO> searchFileLoads(SearchCriteriaDTO criteria) {

        return repository.findAll()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public FileLoadResponseDTO updateFileLoadStatus(Long id, String status) {

        FileLoad file = repository.findById(id).orElseThrow();

        file.setStatus(status);

        return mapToDTO(repository.save(file));
    }

    @Override
    public void deleteFileLoad(Long id) {

        repository.deleteById(id);
    }

    private FileLoadResponseDTO mapToDTO(FileLoad file) {

        FileLoadResponseDTO dto = new FileLoadResponseDTO();

        dto.setId(file.getId());
        dto.setFilename(file.getFilename());
        dto.setLoadDate(file.getLoadDate());
        dto.setStatus(file.getStatus());
        dto.setRecordCount(file.getRecordCount());
        dto.setErrors(file.getErrors());

        return dto;
    }
}