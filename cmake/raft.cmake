
message("#### Raft CMAKE ####")
include_directories(${RAFT_INCLUDE_DIR})
link_directories(${RAFT_LIB_DIR})
SET(CMAKE_MSVCIDE_RUN_PATH ${RAFT_LIB_DIR})

IF(APPLE)
    set (CMAKE_CXX_FLAGS "-F\"${RAFT_FRAMEWORK_DIR}\" ${CMAKE_CXX_FLAGS}")
ENDIF(APPLE)


MACRO(RAFT_INSTALL_HEADERS HEADER_LIST)
    FOREACH( file ${HEADER_LIST} )
        get_filename_component( dir ${file} DIRECTORY )
        install( FILES ${file} DESTINATION include/${dir} )
    ENDFOREACH()
ENDMACRO(RAFT_INSTALL_HEADERS)


# Macro used to set the PATH when running the project from visual studio
set(__RAFT_CMAKE_DIR ${CMAKE_CURRENT_LIST_DIR})
MACRO(RAFT_VS_SETTINGS PROJECT_NAME)
    IF(MSVC)
        configure_file("${__RAFT_CMAKE_DIR}/templates/vstemplate.xml" "${CMAKE_BINARY_DIR}/${PROJECT_NAME}.vcxproj.user" @ONLY)
    ENDIF(MSVC)
ENDMACRO(RAFT_VS_SETTINGS PROJECT_NAME)

IF(MSVC)
    if(CMAKE_CXX_FLAGS MATCHES "/W[0-4]")
      string(REGEX REPLACE "/W[0-4]" "/W3" CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS}")
    else()
      set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} /W3")
    endif()
ENDIF(MSVC)
