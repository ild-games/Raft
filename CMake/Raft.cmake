
message("#### Raft CMAKE ####")
include_directories(${RAFT_INCLUDE_DIR})
link_directories(${RAFT_LIB_DIR})

MACRO(RAFT_INSTALL_HEADERS HEADER_LIST)
    FOREACH ( file ${HEADER_LIST} )
        get_filename_component( dir ${file} DIRECTORY )
        install( FILES ${file} DESTINATION include/${dir} )
    ENDFOREACH()
ENDMACRO(RAFT_INSTALL_HEADERS)
