package com.trade.service.service;

import com.trade.model.dto.FileLoadRequestDTO;
import com.trade.model.dto.FileLoadResponseDTO;
import com.trade.model.dto.SearchCriteriaDTO;

import java.util.List;

public interface FileLoadService {

    FileLoadResponseDTO createFileLoad(FileLoadRequestDTO request);

    FileLoadResponseDTO getFileLoadById(Long id);

    List<FileLoadResponseDTO> searchFileLoads(SearchCriteriaDTO criteria);

    FileLoadResponseDTO updateFileLoadStatus(Long id, String status);

    void deleteFileLoad(Long id);
}