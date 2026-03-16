package com.trade.api.controller;

import com.trade.model.dto.FileLoadRequestDTO;
import com.trade.model.dto.FileLoadResponseDTO;
import com.trade.model.dto.SearchCriteriaDTO;
import com.trade.service.service.FileLoadService;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/file-loads")
public class FileLoadController {

    private final FileLoadService service;

    public FileLoadController(FileLoadService service) {
        this.service = service;
    }

    @PostMapping
    public FileLoadResponseDTO create(@RequestBody FileLoadRequestDTO dto) {
        return service.createFileLoad(dto);
    }

    @GetMapping("/{id}")
    public FileLoadResponseDTO getById(@PathVariable Long id) {
        return service.getFileLoadById(id);
    }

    @GetMapping
    public List<FileLoadResponseDTO> search(SearchCriteriaDTO criteria) {
        return service.searchFileLoads(criteria);
    }

    @PutMapping("/{id}/status")
    public FileLoadResponseDTO updateStatus(@PathVariable Long id,
                                            @RequestParam String status) {
        return service.updateFileLoadStatus(id, status);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteFileLoad(id);
    }
}